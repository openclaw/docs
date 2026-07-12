---
read_when:
    - Vous automatisez l’intégration dans des scripts ou dans la CI
    - Vous avez besoin d’exemples non interactifs pour des fournisseurs spécifiques
sidebarTitle: CLI automation
summary: Intégration scriptée et configuration de l’agent pour la CLI OpenClaw
title: Automatisation de la CLI
x-i18n:
    generated_at: "2026-07-12T03:21:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Utilisez `openclaw onboard --non-interactive` pour automatiser la configuration. Cette commande nécessite `--accept-risk` : la configuration non interactive peut écrire des identifiants et la configuration du démon sans demander de confirmation ; cette option constitue donc l’acceptation explicite du risque.

<Note>
`--json` n’active pas implicitement le mode non interactif. Pour les scripts, transmettez explicitement `--non-interactive --accept-risk`.
</Note>

## Exemple non interactif de référence

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Ajoutez `--json` pour obtenir un récapitulatif lisible par une machine.

- `--gateway-port` utilise par défaut `18789` ; transmettez cette option uniquement pour remplacer cette valeur.
- `--skip-bootstrap` évite de créer les fichiers d’espace de travail par défaut, pour les automatisations qui préremplissent leur propre espace de travail.
- `--secret-input-mode ref` stocke dans le profil d’authentification une référence reposant sur une variable d’environnement (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) au lieu de la clé en texte brut. En mode `ref` non interactif, la variable d’environnement du fournisseur doit déjà être définie dans l’environnement du processus : transmettre une option de clé en ligne sans la variable d’environnement correspondante provoque un échec immédiat.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Exemples propres aux fournisseurs

<AccordionGroup>
  <Accordion title="Exemple avec une clé d’API Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Remplacez cette option par `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` pour utiliser le catalogue Go.
  </Accordion>
  <Accordion title="Exemple avec Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple avec un fournisseur personnalisé">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` est facultative ; certains points de terminaison ne nécessitent pas d’authentification. Si elle est omise, l’intégration initiale recherche `CUSTOM_API_KEY` dans l’environnement. `--custom-provider-id` est facultative et, si elle est omise, sa valeur est automatiquement dérivée de l’URL de base. La valeur par défaut de `--custom-compatibility` est `openai` (autres valeurs : `openai-responses`, `anthropic`).

    OpenClaw déduit la prise en charge des images en entrée à partir de motifs connus d’identifiants de modèles de vision (`gpt-4o`, `claude-3/4`, `gemini`, suffixes `-vl`/`vision` et similaires). Ajoutez `--custom-image-input` pour l’activer de force avec un modèle de vision non reconnu, ou `--custom-text-input` pour imposer les entrées textuelles uniquement.

    Variante en mode référence, qui stocke `apiKey` sous la forme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` :

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

L’authentification par jeton de configuration Anthropic reste prise en charge, mais OpenClaw privilégie la réutilisation de la CLI Claude lorsqu’une connexion locale à celle-ci est disponible. En production, privilégiez une clé d’API Anthropic.

## Ajouter un autre agent

`openclaw agents add <name>` crée un agent distinct disposant de ses propres espace de travail, sessions et profils d’authentification. L’exécuter sans `--workspace` ni aucune autre option lance l’assistant interactif ; transmettre l’une des options `--workspace`, `--model`, `--agent-dir`, `--bind` ou `--non-interactive` l’exécute en mode non interactif et impose alors `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Clés de configuration écrites par la commande (entrée `agents.list[]` correspondant au nouvel identifiant d’agent) :

- `name`
- `workspace`
- `agentDir`
- `model` (uniquement lorsque `--model` est transmise)

Remarques :

- Espace de travail par défaut lorsque `--workspace` est omise dans l’assistant interactif : `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` peut être répétée ; ajoutez des liaisons pour acheminer les messages entrants vers le nouvel agent (l’assistant permet également de le faire de manière interactive).
- Le nom de l’agent est normalisé afin de produire un identifiant d’agent valide ; `main` est réservé.

## Documentation associée

- Portail d’intégration initiale : [Intégration initiale (CLI)](/fr/start/wizard)
- Référence complète : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference)
- Référence de la commande : [`openclaw onboard`](/fr/cli/onboard)
