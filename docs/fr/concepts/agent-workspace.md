---
read_when:
    - Vous devez expliquer l’espace de travail de l’agent ou l’organisation de ses fichiers
    - Vous souhaitez sauvegarder ou migrer l’espace de travail d’un agent
sidebarTitle: Agent workspace
summary: 'Espace de travail de l’agent : emplacement, organisation et stratégie de sauvegarde'
title: Espace de travail de l’agent
x-i18n:
    generated_at: "2026-07-12T15:14:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e09c26d19dd7926b379ae4d094c98c2a2f5b37b9453a4cc2048c3b212ae5a9c2
    source_path: concepts/agent-workspace.md
    workflow: 16
---

L'espace de travail est le domicile de l'agent : le répertoire de travail utilisé par les outils de fichiers
et le contexte de l'espace de travail. Gardez-le privé et considérez-le comme de la mémoire.

Il est distinct de `~/.openclaw/`, qui stocke la configuration, les identifiants et les sessions.

<Warning>
L'espace de travail est le **répertoire de travail courant par défaut**, et non un bac à sable strict. Les outils résolvent les chemins relatifs par rapport à l'espace de travail, mais les chemins absolus peuvent toujours accéder à d'autres emplacements sur l'hôte, sauf si la mise en bac à sable est activée. Si vous avez besoin d'isolation, utilisez [`agents.defaults.sandbox`](/fr/gateway/sandboxing) (et/ou une configuration de bac à sable propre à chaque agent).

Lorsque la mise en bac à sable est activée et que `workspaceAccess` n'est pas `"rw"`, les outils fonctionnent dans un espace de travail de bac à sable sous `~/.openclaw/sandboxes`, et non dans l'espace de travail de votre hôte.
</Warning>

## Emplacement par défaut

- Par défaut : `~/.openclaw/workspace`
- Si `OPENCLAW_PROFILE` est défini et n'est pas `"default"`, la valeur par défaut devient `~/.openclaw/workspace-<profile>`.
- `OPENCLAW_WORKSPACE_DIR` remplace les deux valeurs ci-dessus lorsqu'il est défini.
- Les agents autres que celui par défaut (`agents.list[]`) sans espace de travail explicite utilisent `<state-dir>/workspace-<agentId>`, et non l'espace de travail partagé par défaut.

Remplacez cette valeur dans `~/.openclaw/openclaw.json` :

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Remplacement propre à un agent : `agents.list[].workspace`.

`openclaw onboard`, `openclaw configure` ou `openclaw setup` créent l'espace de travail et y ajoutent les fichiers d'amorçage s'ils sont absents.

<Note>
Les copies d'initialisation du bac à sable n'acceptent que les fichiers ordinaires situés dans l'espace de travail ; les alias par lien symbolique ou lien physique qui pointent hors de l'espace de travail source sont ignorés.
</Note>

Si vous gérez déjà vous-même les fichiers de l'espace de travail, désactivez la création des fichiers d'amorçage :

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dossiers d'espace de travail supplémentaires

Les anciennes installations peuvent avoir créé `~/openclaw`. Conserver plusieurs répertoires d'espace de travail peut entraîner une dérive difficile à comprendre de l'authentification ou de l'état, puisqu'un seul espace de travail est actif à la fois.

<Note>
**Recommandation :** conservez un seul espace de travail actif. Si vous n'utilisez plus les dossiers supplémentaires, archivez-les ou déplacez-les vers la corbeille (par exemple `trash ~/openclaw`). Si vous conservez intentionnellement plusieurs espaces de travail, vérifiez que `agents.defaults.workspace` (ou la clé `workspace` propre à l'agent) pointe vers celui qui est actif.
</Note>

## Carte des fichiers de l'espace de travail

Fichiers standard qu'OpenClaw s'attend à trouver dans l'espace de travail :

<AccordionGroup>
  <Accordion title="AGENTS.md - instructions de fonctionnement">
    Instructions de fonctionnement de l'agent et d'utilisation de la mémoire. Chargées au début de chaque session. Emplacement adapté aux règles, aux priorités et aux détails sur le comportement à adopter.
  </Accordion>
  <Accordion title="SOUL.md - personnalité et ton">
    Personnalité, ton et limites. Chargés à chaque session. Guide : [guide de personnalité SOUL.md](/fr/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - identité de l'utilisateur">
    Identité de l'utilisateur et manière de s'adresser à lui. Chargé à chaque session.
  </Accordion>
  <Accordion title="IDENTITY.md - nom, style et emoji">
    Nom, style et emoji de l'agent. Créé ou mis à jour pendant le rituel d'amorçage.
  </Accordion>
  <Accordion title="TOOLS.md - conventions des outils locaux">
    Notes sur vos outils locaux et leurs conventions. Ne contrôle pas la disponibilité des outils ; il s'agit uniquement d'indications.
  </Accordion>
  <Accordion title="HEARTBEAT.md - liste de contrôle Heartbeat">
    Petite liste de contrôle facultative pour les exécutions Heartbeat. Gardez-la courte pour éviter de consommer inutilement des jetons.
  </Accordion>
  <Accordion title="BOOT.md - liste de contrôle au démarrage">
    Liste de contrôle facultative exécutée automatiquement au démarrage lors du redémarrage du Gateway (lorsque les [hooks internes](/fr/automation/hooks) sont activés). Gardez-la courte ; utilisez l'outil de messagerie pour les envois sortants.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - rituel de première exécution">
    Rituel unique de première exécution. Créé uniquement pour un tout nouvel espace de travail. Supprimez-le une fois le rituel terminé.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - journal quotidien de mémoire">
    Journal quotidien de mémoire (un fichier par jour). Il est recommandé de lire les entrées d'aujourd'hui et d'hier au démarrage d'une session.
  </Accordion>
  <Accordion title="MEMORY.md - mémoire à long terme organisée (facultatif)">
    Mémoire à long terme organisée : faits durables, préférences, décisions et résumés courts. Conservez les journaux détaillés dans `memory/YYYY-MM-DD.md` afin que les outils de mémoire puissent les récupérer à la demande sans les injecter dans chaque prompt. Ne chargez `MEMORY.md` que dans la session principale privée (pas dans les contextes partagés ou de groupe). Consultez [Mémoire](/fr/concepts/memory) pour le processus et l'enregistrement automatique de la mémoire.
  </Accordion>
  <Accordion title="skills/ - Skills de l'espace de travail (facultatif)">
    Skills propres à l'espace de travail. Emplacement de Skills ayant la priorité la plus élevée pour cet espace de travail, avant les Skills d'agent du projet, les Skills d'agent personnels, les Skills gérés, les Skills intégrés et `skills.load.extraDirs` lorsque des noms sont identiques.
  </Accordion>
  <Accordion title="canvas/ - fichiers de l'interface Canvas (facultatif)">
    Fichiers de l'interface Canvas pour l'affichage des nœuds (par exemple `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Si un fichier d'amorçage est absent, OpenClaw injecte un marqueur « fichier manquant » dans la session et poursuit son exécution. Les fichiers d'amorçage volumineux sont tronqués lors de l'injection ; ajustez les limites avec `agents.defaults.bootstrapMaxChars` (valeur par défaut : `20000`) et `agents.defaults.bootstrapTotalMaxChars` (valeur par défaut : `60000`). `openclaw setup` peut recréer les fichiers par défaut manquants sans remplacer les fichiers existants.
</Note>

## Éléments qui ne se trouvent PAS dans l'espace de travail

Les éléments suivants se trouvent sous `~/.openclaw/` et ne doivent PAS être validés dans le dépôt de l'espace de travail :

- `~/.openclaw/openclaw.json` (configuration)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profils d'authentification des modèles : OAuth + clés d'API)
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` (lignes de session, transcriptions et état d'exécution propre à l'agent)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (compte d'exécution Codex propre à l'agent, configuration, Skills, Plugins et état natif des fils)
- `~/.openclaw/credentials/` (état des canaux et fournisseurs, ainsi que les données héritées d'importation OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (sources de migration héritées et artefacts d'archivage ou d'assistance)
- `~/.openclaw/skills/` (Skills gérés)

Si vous devez migrer des sessions ou la configuration, copiez-les séparément et excluez-les du contrôle de version.

## Sauvegarde Git (recommandée, privée)

Considérez l'espace de travail comme une mémoire privée. Placez-le dans un dépôt Git **privé** afin qu'il soit sauvegardé et récupérable.

Exécutez ces étapes sur la machine où le Gateway s'exécute (c'est là que se trouve l'espace de travail).

<Steps>
  <Step title="Initialiser le dépôt">
    Si Git est installé, les nouveaux espaces de travail sont initialisés automatiquement. Si cet espace de travail n'est pas déjà un dépôt, exécutez :

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Ajouter un dépôt distant privé">
    <Tabs>
      <Tab title="Interface Web de GitHub">
        1. Créez un nouveau dépôt **privé** sur GitHub.
        2. Ne l'initialisez pas avec un README afin d'éviter les conflits de fusion.
        3. Copiez l'URL HTTPS du dépôt distant.
        4. Ajoutez le dépôt distant et envoyez les modifications :

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="CLI GitHub (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Interface Web de GitLab">
        1. Créez un nouveau dépôt **privé** sur GitLab.
        2. Ne l'initialisez pas avec un README afin d'éviter les conflits de fusion.
        3. Copiez l'URL HTTPS du dépôt distant.
        4. Ajoutez le dépôt distant et envoyez les modifications :

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Mises à jour régulières">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Ne validez pas de secrets

<Warning>
Même dans un dépôt privé, évitez de stocker des secrets dans l'espace de travail :

- Clés d'API, jetons OAuth, mots de passe ou identifiants privés.
- Tout élément situé sous `~/.openclaw/`.
- Exportations brutes de conversations ou pièces jointes sensibles.

Si vous devez stocker des références sensibles, utilisez des espaces réservés et conservez le véritable secret ailleurs (gestionnaire de mots de passe, variables d'environnement ou `~/.openclaw/`).
</Warning>

Exemple initial de `.gitignore` :

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Déplacement de l'espace de travail vers une nouvelle machine

<Steps>
  <Step title="Cloner le dépôt">
    Clonez le dépôt vers le chemin souhaité (par défaut `~/.openclaw/workspace`).
  </Step>
  <Step title="Mettre à jour la configuration">
    Définissez `agents.defaults.workspace` sur ce chemin dans `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Créer les fichiers manquants">
    Exécutez `openclaw setup --workspace <path>` pour créer les éventuels fichiers manquants.
  </Step>
  <Step title="Copier les sessions (facultatif)">
    Si vous avez besoin des sessions, copiez séparément `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
    depuis l'ancienne machine. Copiez `~/.openclaw/agents/<agentId>/sessions/`
    uniquement si vous avez également besoin des entrées de migration héritées ou des artefacts d'archivage ou d'assistance.
  </Step>
</Steps>

## Remarques avancées

- Le routage multi-agent peut utiliser différents espaces de travail pour chaque agent au moyen de `agents.list[].workspace`. Consultez [Routage des canaux](/fr/channels/channel-routing) pour la configuration du routage.
- Si `agents.defaults.sandbox` est activé, les sessions autres que la session principale peuvent utiliser des espaces de travail de bac à sable propres à chaque session sous `agents.defaults.sandbox.workspaceRoot`.

## Pages connexes

- [Heartbeat](/fr/gateway/heartbeat) - fichier HEARTBEAT.md de l'espace de travail
- [Mise en bac à sable](/fr/gateway/sandboxing) - accès à l'espace de travail dans les environnements mis en bac à sable
- [Session](/fr/concepts/session) - chemins de stockage des sessions
- [Consignes permanentes](/fr/automation/standing-orders) - instructions persistantes dans les fichiers de l'espace de travail
