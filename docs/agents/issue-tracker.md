# Issue tracker: Linear

Issues and specs for this repo live in Linear.
Use the `composio` CLI (Linear toolkit is already connected).
Do not use GitHub Issues for this repo.

## Scope

- **Workspace**: AppZudio
- **Team**: AppZudio (`AZ`)
- **Project**: [React Native Experiments](https://linear.app/appzudio/project/react-native-experiments-8e84039ba5dc)

Every issue created for this repo MUST be on the AppZudio team and in the React Native Experiments project.

Resolve IDs at call time.
Do not hardcode team or project UUIDs in commands or docs.
`composio execute` redacts UUIDs in tool output, so chaining `LINEAR_LIST_*` into a later `execute` will fail with "Entity not found".
Prefer `composio proxy` to `https://api.linear.app/graphql` when a mutation needs an ID from a prior lookup.

Lookup query:

```graphql
query {
  teams(filter: { key: { eq: "AZ" } }) {
    nodes { id key name }
  }
  projects(filter: { name: { eq: "React Native Experiments" } }) {
    nodes { id name url }
  }
}
```

Issue identifiers are `AZ-<number>` (or the issue UUID).
Bare GitHub-style `#42` is not a Linear identifier.

## Conventions

- **Create an issue**: `composio execute LINEAR_CREATE_LINEAR_ISSUE` with `team_id`, `title`, `project_id`, and optional `description` / `label_ids` / `parent_id`.
  Or GraphQL `issueCreate` via `composio proxy` after resolving IDs.
- **Read an issue**: `composio execute LINEAR_GET_LINEAR_ISSUE -d '{ "issue_id": "AZ-123" }'`.
  Comments are nested under the issue payload.
- **List issues**: `composio execute LINEAR_LIST_LINEAR_ISSUES` filtered by `project_id`, or `LINEAR_SEARCH_ISSUES` by text / identifier.
- **Comment on an issue**: `composio execute LINEAR_CREATE_LINEAR_COMMENT -d '{ "issueId": "AZ-123", "body": "..." }'`.
- **Apply / remove labels**: `composio execute LINEAR_UPDATE_ISSUE` with `issueId` and the full replacement `labelIds` set.
  Always re-read current labels first so an update does not drop unrelated ones.
- **Close**: look up the team's Done / Canceled state with `LINEAR_LIST_LINEAR_STATES` (or GraphQL `team(id) { states { nodes { id name type } } }`), then `LINEAR_UPDATE_ISSUE` with that `stateId`.
  Add a closing comment first when the skill asks for one.

## When a skill says "publish to the issue tracker"

Create a Linear issue on team `AZ` in the React Native Experiments project.
Apply `needs-triage` unless the skill already specified another triage label.

## When a skill says "fetch the relevant ticket"

Run `LINEAR_GET_LINEAR_ISSUE` with the `AZ-<n>` identifier.

## Wayfinding operations

Used by `/wayfinder`.
The **map** is a single Linear issue with **child** issues as tickets.

- **Map**: one issue titled as the wayfinder map, labelled `wayfinder:map`, holding Notes / Decisions-so-far / Fog in the description.
- **Child ticket**: `LINEAR_CREATE_LINEAR_ISSUE` with `parent_id` set to the map issue.
  Put `Part of AZ-<map>` at the top of the child description.
  Labels: `wayfinder:<type>` (`research` / `prototype` / `grilling` / `task`).
  Once claimed, assign the ticket to the driving dev.
- **Blocking**: Linear relations via `LINEAR_CREATE_LINEAR_ISSUE_RELATION`.
  A ticket is unblocked when every blocker is in a completed or canceled state.
- **Frontier query**: list the map's open children, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: `LINEAR_UPDATE_ISSUE` with `assigneeId` set to the current user (`LINEAR_GET_CURRENT_USER`).
  That is the session's first write.
- **Resolve**: comment the answer, move the issue to Done, then append a context pointer to the map's Decisions-so-far.
