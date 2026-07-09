from __future__ import annotations

import json
import os
import textwrap
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CATALOG = ROOT / "catalog" / "all-tasks.json"
DEFAULT_HIERARCHY = ROOT / "catalog" / "hierarchy.json"
DEFAULT_SAVED_VIEWS = ROOT / "catalog" / "saved-views.json"
DEFAULT_TASK_BUNDLES = ROOT / "catalog" / "task-bundles.json"
DEFAULT_PROVENANCE = ROOT / "catalog" / "provenance-index.json"

PERSONAS = {
    "Benchmark maintainer": {
        "query": "proofloop benchmark official scorer gate",
        "sort": "difficulty",
        "goals": "Find benchmark families, blockers, official-score boundaries, and maintenance gates.",
    },
    "Model evaluator": {
        "query": "model-attempt spreadsheetbench prod proxy",
        "sort": "cost",
        "goals": "Compare model-attempt tasks by cost, run command, and benchmark family.",
    },
    "Product QA": {
        "query": "browser test chat graph trace notebook",
        "sort": "difficulty",
        "goals": "Find live browser flows and UI regression surfaces.",
    },
    "Finance analyst": {
        "query": "spreadsheetbench bankertoolbench accounting finance evidence",
        "sort": "domain",
        "goals": "Find finance and spreadsheet work that can be run or reviewed first.",
    },
    "New contributor": {
        "query": "nodeagent graph intro source test",
        "sort": "difficulty",
        "goals": "Start with low-cost, low-difficulty tasks that explain the system.",
    },
}

SORT_OPTIONS = {
    "Relevance": "relevance",
    "Lowest difficulty": "difficulty",
    "Highest difficulty": "difficulty-desc",
    "Fewest steps": "steps",
    "Lowest cost": "cost",
    "Domain hierarchy": "domain",
}

DIFFICULTY_ORDER = {"intro": 1, "intermediate": 2, "advanced": 3, "expert": 4}


st.set_page_config(page_title="NodeTasks", layout="wide")

st.markdown(
    """
    <style>
    .block-container { padding-top: 1.2rem; }
    div[data-testid="stMetric"] {
      background: #0f1419;
      border: 1px solid #252b31;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .nt-chip {
      display: inline-block;
      border: 1px solid #2b333c;
      background: #111820;
      color: #d7dee7;
      border-radius: 999px;
      padding: 2px 8px;
      margin: 2px 4px 2px 0;
      font-size: 12px;
    }
    .nt-muted { color: #8f9aa6; font-size: 13px; }
    .nt-card {
      border-top: 1px solid #252b31;
      padding: 12px 0;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data(show_spinner=False)
def load_catalog(catalog_path: str) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    path = Path(catalog_path)
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    hierarchy_path = DEFAULT_HIERARCHY if path.name == "all-tasks.json" else path.with_name("hierarchy.json")
    hierarchy = {}
    if hierarchy_path.exists():
        with hierarchy_path.open("r", encoding="utf-8") as handle:
            hierarchy = json.load(handle)
    return payload["tasks"], hierarchy


@st.cache_data(show_spinner=False)
def load_json_sidecar(path: str) -> dict[str, Any]:
    sidecar = Path(path)
    if not sidecar.exists():
        return {}
    with sidecar.open("r", encoding="utf-8") as handle:
        return json.load(handle)


@st.cache_data(show_spinner=False)
def build_frame(tasks: list[dict[str, Any]]) -> pd.DataFrame:
    rows = []
    for task in tasks:
        rank = task.get("rank", {})
        rows.append(
            {
                "id": task.get("id", ""),
                "title": task.get("title", ""),
                "goal": task.get("goal", ""),
                "kind": task.get("kind", ""),
                "family": task.get("family", ""),
                "surface": task.get("surface", ""),
                "status": task.get("status", ""),
                "domain": rank.get("domain", ""),
                "subdomain": rank.get("subdomain", ""),
                "difficulty": rank.get("difficultyTier", ""),
                "difficulty_score": rank.get("difficultyScore", 0),
                "steps": rank.get("estimatedSteps", 0),
                "step_tier": rank.get("stepTier", ""),
                "cost_tier": rank.get("costTier", ""),
                "cost_rank": rank.get("costRank", 0),
                "estimated_cost_usd": rank.get("estimatedCostUsd"),
                "persona_fit": ", ".join(rank.get("personaFit", [])),
                "top_tags": ", ".join(rank.get("topTags", [])),
                "source_refs": ", ".join(task.get("sourceRefs", [])[:4]),
                "command": task.get("command", ""),
                "curation_summary": task.get("curation", {}).get("summary", ""),
                "why_it_matters": task.get("curation", {}).get("whyItMatters", ""),
                "verifier_type": task.get("provenance", {}).get("verifierType", ""),
                "score_status": task.get("provenance", {}).get("scoreStatus", ""),
                "primary_suite": task.get("provenance", {}).get("primarySuite", ""),
                "source_count": task.get("provenance", {}).get("sourceCount", 0),
                "sort_score": rank.get("sortScore", 0),
                "text": searchable_text(task),
            }
        )
    return pd.DataFrame(rows)


def searchable_text(task: dict[str, Any]) -> str:
    parts = [
        task.get("id", ""),
        task.get("kind", ""),
        task.get("family", ""),
        task.get("surface", ""),
        task.get("title", ""),
        task.get("goal", ""),
        task.get("curation", {}).get("summary", ""),
        task.get("curation", {}).get("whyItMatters", ""),
        task.get("provenance", {}).get("verifierType", ""),
        task.get("provenance", {}).get("scoreStatus", ""),
        task.get("provenance", {}).get("primarySuite", ""),
        task.get("status", ""),
        task.get("command", ""),
        " ".join(task.get("tags", [])),
        " ".join(task.get("rank", {}).get("topTags", [])),
        json.dumps(task.get("metadata", {}), ensure_ascii=True),
    ]
    return " ".join(str(part) for part in parts if part).lower()


def score_rows(frame: pd.DataFrame, query: str) -> pd.DataFrame:
    terms = [part for part in query.lower().replace("/", " ").replace("-", " ").split() if part]
    if not terms:
        scored = frame.copy()
        scored["relevance"] = 1
        return scored

    def score(row: pd.Series) -> int:
        text = row["text"]
        total = 0
        for term in terms:
            if term in row["id"].lower():
                total += 12
            if term in row["title"].lower():
                total += 8
            if term in row["goal"].lower():
                total += 5
            if term in row["top_tags"].lower():
                total += 4
            if term in text:
                total += 1
        return total

    scored = frame.copy()
    scored["relevance"] = scored.apply(score, axis=1)
    return scored[scored["relevance"] > 0]


def apply_sort(frame: pd.DataFrame, sort_mode: str) -> pd.DataFrame:
    relevance = ["relevance"] if "relevance" in frame.columns else []
    relevance_desc = [False] if relevance else []
    if sort_mode == "difficulty":
        return frame.sort_values([*relevance, "difficulty_score", "steps", "cost_rank", "id"], ascending=[*relevance_desc, True, True, True, True])
    if sort_mode == "difficulty-desc":
        return frame.sort_values([*relevance, "difficulty_score", "steps", "cost_rank", "id"], ascending=[*relevance_desc, False, False, False, True])
    if sort_mode == "steps":
        return frame.sort_values([*relevance, "steps", "difficulty_score", "cost_rank", "id"], ascending=[*relevance_desc, True, True, True, True])
    if sort_mode == "cost":
        return frame.sort_values([*relevance, "cost_rank", "estimated_cost_usd", "difficulty_score", "id"], ascending=[*relevance_desc, True, True, True, True], na_position="last")
    if sort_mode == "domain":
        return frame.sort_values([*relevance, "domain", "subdomain", "difficulty_score", "cost_rank", "steps", "id"], ascending=[*relevance_desc, True, True, True, True, True, True])
    return frame.sort_values(["relevance", "difficulty_score", "cost_rank", "steps", "id"], ascending=[False, True, True, True, True])


def filtered_tasks(
    frame: pd.DataFrame,
    query: str,
    domains: list[str],
    kinds: list[str],
    difficulty: list[str],
    cost_tiers: list[str],
    tag_query: str,
    persona: str,
    sort_mode: str,
) -> pd.DataFrame:
    result = score_rows(frame, query)
    if domains:
        result = result[result["domain"].isin(domains)]
    if kinds:
        result = result[result["kind"].isin(kinds)]
    if difficulty:
        result = result[result["difficulty"].isin(difficulty)]
    if cost_tiers:
        result = result[result["cost_tier"].isin(cost_tiers)]
    if tag_query:
        needle = tag_query.lower()
        result = result[result["top_tags"].str.lower().str.contains(needle, regex=False) | result["family"].str.lower().str.contains(needle, regex=False)]
    if persona != "Any":
        result = result[result["persona_fit"].str.lower().str.contains(persona.lower().split()[0], regex=False) | (result["relevance"] > 0)]
    return apply_sort(result, sort_mode)


def task_by_id(tasks: list[dict[str, Any]], task_id: str) -> dict[str, Any] | None:
    for task in tasks:
        if task.get("id") == task_id:
            return task
    return None


def call_nodeagent(endpoint: str, question: str, context: list[dict[str, Any]], persona: str, view: str) -> str | None:
    if not endpoint:
        return None
    body = json.dumps(
        {
            "schema": "nodetasks-nodeagent-bridge-v1",
            "mode": "catalog_qa",
            "question": question,
            "message": question,
            "persona": persona,
            "savedView": view,
            "catalogContext": context,
            "context": context,
            "responseContract": {
                "answerField": "answer",
                "mustCiteTaskIds": True,
                "mustPreserveScoreBoundary": True,
            },
        }
    ).encode("utf-8")
    request = urllib.request.Request(endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        return f"NodeAgent endpoint was configured but did not return a usable response: {exc}"
    if isinstance(payload.get("message"), dict):
        return payload["message"].get("content")
    return payload.get("answer") or payload.get("text") or payload.get("finalText") or json.dumps(payload, indent=2)


def local_nodeagent_answer(question: str, rows: pd.DataFrame, persona: str) -> str:
    if rows.empty:
        return "I could not find matching tasks in the current filter set. Clear filters or broaden the query."

    top = rows.head(8)
    domains = Counter(top["domain"]).most_common(3)
    difficulties = Counter(top["difficulty"]).most_common()
    cheapest = apply_sort(top, "cost").head(1).iloc[0]
    easiest = apply_sort(top, "difficulty").head(1).iloc[0]
    first = top.iloc[0]
    lines = [
        f"NodeAgent catalog mode found {len(rows):,} matching task(s) for {persona}.",
        "",
        f"Best ranked match: `{first['id']}` - {first['title']}",
        f"Domain: {first['domain']} > {first['subdomain']}; difficulty {first['difficulty']} ({int(first['difficulty_score'])}); {int(first['steps'])} estimated steps; cost tier `{first['cost_tier']}`.",
        f"Provenance: `{first['verifier_type']}`; score status `{first['score_status']}`; primary suite `{first['primary_suite']}`.",
        "",
        f"Lowest-cost starting point: `{cheapest['id']}` ({cheapest['cost_tier']}).",
        f"Easiest starting point: `{easiest['id']}` ({easiest['difficulty']}, {int(easiest['steps'])} steps).",
        "",
        "Dominant domains: " + ", ".join(f"{name} ({count})" for name, count in domains),
        "Difficulty mix: " + ", ".join(f"{name} ({count})" for name, count in difficulties),
        "",
        "Recommended next action:",
        recommendation_for(persona, first),
        "",
        "Cited task ids:",
    ]
    lines.extend(f"- `{row['id']}` - {row['source_refs']}" for _, row in top.head(5).iterrows())
    return "\n".join(lines)


def recommendation_for(persona: str, row: pd.Series) -> str:
    if persona == "Benchmark maintainer":
        return "Start from the benchmark-family or benchmark-target task, inspect blockers, then run only the listed command once the verifier boundary is clear."
    if persona == "Model evaluator":
        return "Filter to model-attempt tasks, sort by cost, and run a small representative set before expanding the full matrix."
    if persona == "Product QA":
        return "Use browser-test-case and curated-live tasks first because they map directly to user-visible workflows."
    if persona == "Finance analyst":
        return "Prefer SpreadsheetBench, BankerToolBench, accounting, and evidence-backed tasks; avoid official-score claims unless receipts exist."
    if persona == "New contributor":
        return "Pick intro or intermediate free-static tasks first, then open the cited source files before running browser or provider paths."
    return f"Open `{row['id']}`, inspect its source refs, then run or adapt the listed command only if the required environment is available."


def render_task_card(task: dict[str, Any]) -> None:
    rank = task.get("rank", {})
    st.markdown(f"### {task.get('title', task.get('id'))}")
    st.caption(task.get("id", ""))
    cols = st.columns(5)
    cols[0].metric("Difficulty", f"{rank.get('difficultyTier', '')}", f"{rank.get('difficultyScore', '')}")
    cols[1].metric("Steps", rank.get("estimatedSteps", 0))
    cols[2].metric("Cost", rank.get("costTier", ""))
    cols[3].metric("Domain", rank.get("domain", ""))
    cols[4].metric("Kind", task.get("kind", ""))
    st.write(task.get("goal", ""))
    curation = task.get("curation", {})
    if curation:
        st.markdown(f"**Why it matters:** {curation.get('whyItMatters', '')}")
        st.markdown(f"**First run:** {curation.get('firstRun', '')}")
        st.caption(curation.get("scoreBoundary", ""))
    if task.get("command"):
        st.code(task["command"], language="bash")
    if rank.get("topTags"):
        st.markdown(" ".join(f"<span class='nt-chip'>{tag}</span>" for tag in rank["topTags"]), unsafe_allow_html=True)
    with st.expander("Source refs and metadata", expanded=False):
        st.json({"sourceRefs": task.get("sourceRefs", []), "metadata": task.get("metadata", {}), "rank": rank, "curation": curation, "provenance": task.get("provenance", {})})


def saved_view_by_id(saved_views: list[dict[str, Any]], view_id: str) -> dict[str, Any] | None:
    for view in saved_views:
        if view.get("id") == view_id:
            return view
    return None


def query_param(name: str, default: str = "") -> str:
    value = st.query_params.get(name, default)
    if isinstance(value, list):
        return value[0] if value else default
    return value or default


def query_param_list(name: str) -> list[str]:
    raw = query_param(name, "")
    return [part.strip() for part in raw.split(",") if part.strip()]


catalog_path = os.environ.get("NODETASKS_CATALOG", str(DEFAULT_CATALOG))
tasks, hierarchy = load_catalog(catalog_path)
saved_views_payload = load_json_sidecar(str(DEFAULT_SAVED_VIEWS))
task_bundles_payload = load_json_sidecar(str(DEFAULT_TASK_BUNDLES))
provenance_payload = load_json_sidecar(str(DEFAULT_PROVENANCE))
saved_views = saved_views_payload.get("views", [])
task_bundles = task_bundles_payload.get("bundles", [])
frame = build_frame(tasks)

st.title("NodeTasks")
st.caption("Search, rank, and ask NodeAgent about NodeRoom benchmark tasks.")

with st.sidebar:
    st.header("Filters")
    persona_options = ["Any", *PERSONAS.keys()]
    default_persona = query_param("persona", "Any")
    persona = st.selectbox("Persona", persona_options, index=persona_options.index(default_persona) if default_persona in persona_options else 0)
    saved_view_options = ["None", *[view["id"] for view in saved_views]]
    default_view = query_param("view", "None")
    saved_view = st.selectbox("Saved view", saved_view_options, index=saved_view_options.index(default_view) if default_view in saved_view_options else 0)
    active_view = saved_view_by_id(saved_views, saved_view) if saved_view != "None" else None
    view_filters = active_view.get("filters", {}) if active_view else {}
    default_query = query_param("q", active_view.get("query", PERSONAS.get(persona, {}).get("query", "")) if active_view else PERSONAS.get(persona, {}).get("query", ""))
    query = st.text_input("Search", value=default_query, placeholder="nodeagent graph spreadsheetbench")
    default_sort_mode = query_param("sort", active_view.get("sort", PERSONAS.get(persona, {}).get("sort", "relevance")) if active_view else PERSONAS.get(persona, {}).get("sort", "relevance"))
    sort_labels = list(SORT_OPTIONS.keys())
    sort_values = list(SORT_OPTIONS.values())
    default_sort_index = sort_values.index(default_sort_mode) if default_sort_mode in sort_values else 0
    sort_label = st.selectbox("Sort", sort_labels, index=default_sort_index)
    sort_mode = SORT_OPTIONS[sort_label]
    domain_options = sorted(frame["domain"].dropna().unique())
    kind_options = sorted(frame["kind"].dropna().unique())
    difficulty_options = ["intro", "intermediate", "advanced", "expert"]
    cost_options = sorted(frame["cost_tier"].dropna().unique())
    view_domain_default = [view_filters["domain"]] if view_filters.get("domain") in domain_options and not query_param_list("domain") else []
    view_kind_default = [item for item in view_filters.get("kind", []) if item in kind_options] if not query_param_list("kind") else []
    view_difficulty_default = [item for item in difficulty_options if view_filters.get("maxDifficulty") and DIFFICULTY_ORDER[item] <= DIFFICULTY_ORDER.get(view_filters["maxDifficulty"], 99)] if not query_param_list("difficulty") else []
    domains = st.multiselect("Domain", domain_options, default=[item for item in query_param_list("domain") if item in domain_options] or view_domain_default)
    kinds = st.multiselect("Kind", kind_options, default=[item for item in query_param_list("kind") if item in kind_options] or view_kind_default)
    difficulty = st.multiselect("Difficulty", difficulty_options, default=[item for item in query_param_list("difficulty") if item in difficulty_options] or view_difficulty_default)
    cost_tiers = st.multiselect("Cost tier", cost_options, default=[item for item in query_param_list("cost") if item in cost_options])
    tag_query = st.text_input("Tag contains", value=query_param("tag", view_filters.get("tag", "")))
    limit = st.slider("Rows", min_value=10, max_value=500, value=100, step=10)
    endpoint = st.text_input("NodeAgent endpoint", value=os.environ.get("NODEAGENT_ENDPOINT", ""), help="Optional POST endpoint. Empty uses local catalog mode.")

ranked = filtered_tasks(frame, query, domains, kinds, difficulty, cost_tiers, tag_query, persona, sort_mode)
shown = ranked.head(limit)

metric_cols = st.columns(5)
metric_cols[0].metric("Searchable tasks", f"{len(frame):,}")
metric_cols[1].metric("Filtered", f"{len(ranked):,}")
metric_cols[2].metric("Domains", frame["domain"].nunique())
metric_cols[3].metric("Kinds", frame["kind"].nunique())
metric_cols[4].metric("Cost tiers", frame["cost_tier"].nunique())

tab_search, tab_hierarchy, tab_bundles, tab_provenance, tab_agent, tab_personas = st.tabs(["Search", "Hierarchy", "Saved views", "Provenance", "NodeAgent", "Persona tests"])

with tab_search:
    st.subheader("Ranked task table")
    st.dataframe(
        shown[
            [
                "id",
                "title",
                "domain",
                "subdomain",
                "kind",
                "difficulty",
                "difficulty_score",
                "steps",
                "cost_tier",
                "verifier_type",
                "score_status",
                "top_tags",
            ]
        ],
        use_container_width=True,
        height=460,
    )
    selected_id = st.selectbox("Inspect task", shown["id"].tolist() if not shown.empty else [])
    if selected_id:
        selected = task_by_id(tasks, selected_id)
        if selected:
            render_task_card(selected)
    st.download_button("Download filtered JSON", data=shown.to_json(orient="records", indent=2), file_name="nodetasks-filtered.json", mime="application/json")

with tab_hierarchy:
    st.subheader("Domain hierarchy")
    if hierarchy:
        domains_payload = hierarchy.get("hierarchy", {}).get("domains", [])
        for domain_info in domains_payload:
            with st.expander(f"{domain_info['domain']} ({domain_info['count']:,})", expanded=False):
                st.write("Subdomains")
                st.json(domain_info.get("subdomains", {}))
                rows = []
                for difficulty_group in domain_info.get("difficultyGroups", []):
                    for cost_group in difficulty_group.get("costGroups", []):
                        rows.append(
                            {
                                "difficulty": difficulty_group["difficultyTier"],
                                "cost_tier": cost_group["costTier"],
                                "count": cost_group["count"],
                                "families": ", ".join(f"{name}:{count}" for name, count in list(cost_group.get("families", {}).items())[:6]),
                            }
                        )
                st.dataframe(pd.DataFrame(rows), use_container_width=True)
    else:
        st.info("No hierarchy file was found. Run npm run build:catalog.")

with tab_bundles:
    st.subheader("Saved views and shareable bundles")
    if saved_views:
        st.dataframe(
            pd.DataFrame(
                [
                    {
                        "id": view.get("id"),
                        "title": view.get("title"),
                        "persona": view.get("persona"),
                        "count": view.get("count"),
                        "sort": view.get("sort"),
                        "query": view.get("query"),
                    }
                    for view in saved_views
                ]
            ),
            use_container_width=True,
            hide_index=True,
        )
    for bundle in task_bundles:
        with st.expander(f"{bundle.get('title')} ({bundle.get('taskCount')} tasks)", expanded=bundle.get("id") == saved_view):
            st.write(bundle.get("description", ""))
            st.caption(f"Persona: {bundle.get('persona')} | estimated steps: {bundle.get('estimatedStepTotal')} | max difficulty score: {bundle.get('maxDifficultyScore')}")
            st.dataframe(pd.DataFrame(bundle.get("tasks", [])), use_container_width=True, hide_index=True)
            st.download_button(
                f"Download {bundle.get('id')} bundle",
                data=json.dumps(bundle, indent=2),
                file_name=f"{bundle.get('id')}.json",
                mime="application/json",
            )

with tab_provenance:
    st.subheader("Provenance and score boundaries")
    st.caption("Every task keeps product-path proof separate from official semantic benchmark scoring.")
    pcols = st.columns(3)
    pcols[0].metric("Verifier types", provenance_payload.get("counts", {}).get("verifierTypes", 0))
    pcols[1].metric("Score statuses", provenance_payload.get("counts", {}).get("scoreStatuses", 0))
    pcols[2].metric("Primary suites", provenance_payload.get("counts", {}).get("primarySuites", 0))
    st.write("Verifier types")
    st.dataframe(pd.DataFrame(sorted(provenance_payload.get("verifierTypes", {}).items(), key=lambda item: item[1], reverse=True), columns=["verifier_type", "tasks"]), use_container_width=True, hide_index=True)
    st.write("Score statuses")
    st.dataframe(pd.DataFrame(sorted(provenance_payload.get("scoreStatuses", {}).items(), key=lambda item: item[1], reverse=True), columns=["score_status", "tasks"]), use_container_width=True, hide_index=True)
    st.write("Sample tasks by verifier")
    for verifier_type, samples in provenance_payload.get("samplesByVerifierType", {}).items():
        with st.expander(f"{verifier_type} ({len(samples)} samples)", expanded=False):
            st.dataframe(pd.DataFrame(samples), use_container_width=True, hide_index=True)

with tab_agent:
    st.subheader("Ask NodeAgent")
    st.caption("Uses NODEAGENT_ENDPOINT when configured; otherwise answers deterministically from the ranked catalog.")
    with st.expander("Bridge contract", expanded=False):
        st.code(
            json.dumps(
                {
                    "schema": "nodetasks-nodeagent-bridge-v1",
                    "mode": "catalog_qa",
                    "question": "Which tasks should I run first?",
                    "persona": persona,
                    "savedView": saved_view,
                    "catalogContext": "top filtered rows",
                    "responseContract": {"answerField": "answer", "mustCiteTaskIds": True, "mustPreserveScoreBoundary": True},
                },
                indent=2,
            ),
            language="json",
        )
    ask_preview = query_param("ask", query or "What should I run first?")
    with st.expander("NodeAgent answer preview for current filters", expanded=True):
        st.markdown(local_nodeagent_answer(ask_preview, ranked, persona))
    if "chat" not in st.session_state:
        st.session_state.chat = []
    prompt = st.chat_input("Ask about tasks, ranks, costs, domains, or what a persona should run first")
    for message in st.session_state.chat:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    if prompt:
        st.session_state.chat.append({"role": "user", "content": prompt})
        context = shown.head(12).to_dict(orient="records")
        external = call_nodeagent(endpoint, prompt, context, persona, saved_view)
        answer = external or local_nodeagent_answer(prompt, ranked, persona)
        st.session_state.chat.append({"role": "assistant", "content": answer})
        st.rerun()

with tab_personas:
    st.subheader("Persona lenses")
    for name, config in PERSONAS.items():
        persona_rows = filtered_tasks(
            frame,
            config["query"],
            domains=[],
            kinds=[],
            difficulty=[],
            cost_tiers=[],
            tag_query="",
            persona=name,
            sort_mode=config["sort"],
        ).head(5)
        with st.expander(f"{name}: {config['goals']}", expanded=name == "New contributor"):
            st.dataframe(
                persona_rows[["id", "title", "domain", "kind", "difficulty", "steps", "cost_tier"]],
                use_container_width=True,
                hide_index=True,
            )
            st.markdown(local_nodeagent_answer(config["query"], persona_rows, name))
