
% This rule will enforce that a workspace MUST depend on the same version of a dependency as the one used by the other workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  % Iterates over all dependencies from all workspaces
    workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  % Iterates over similarly-named dependencies from all workspaces (again)
    workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
  % Ignore peer dependencies
    DependencyType \= 'peerDependencies',
    DependencyType2 \= 'peerDependencies',
    DependencyRange2 @> DependencyRange,
  % Ignore devDependencies on other workspaces
    (
      (DependencyType = 'devDependencies'; DependencyType2 = 'devDependencies') ->
        \+ workspace_ident(DependencyCwd, DependencyIdent)
      ;
        true
    ).

% This rule will prevent workspaces from depending on non-workspace versions of available workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, 'workspace:^', DependencyType) :-
  % Iterates over all dependencies from all workspaces
    workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  % Only consider those that target something that could be a workspace
    workspace_ident(DependencyCwd, DependencyIdent).

% This rule enforces that all packages that depend on TypeScript must also depend on tslib
gen_enforced_dependency(WorkspaceCwd, 'tslib', DependencyRange2, DependencyType) :-
  % Iterates over all TypeScript dependencies from all workspaces
    workspace_has_dependency(WorkspaceCwd, 'typescript', _, DependencyType),
  % Ignores the case when TypeScript is a peer dependency
    DependencyType \= 'peerDependencies',
  % Fetch the version from root
    workspace_has_dependency('monorepo-tooling-scripts', 'tslib', DependencyRange2, _),
  % Only proceed if the workspace doesn't already depend on tslib
    \+ workspace_has_dependency(WorkspaceCwd, 'tslib', _, _).


% PACKAGE SETTINGS

% Ensure all packages include a license field
gen_enforced_field(WorkspaceCwd, 'license', 'Apache 2.0').
