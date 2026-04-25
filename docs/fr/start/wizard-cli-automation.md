---
read_when:
    - Vous automatisez l’onboarding dans des scripts ou en CI
    - Vous avez besoin d’exemples non interactifs pour des fournisseurs spécifiques
sidebarTitle: CLI automation
summary: Onboarding scripté et configuration de l’agent pour la CLI OpenClaw
title: Automatisation CLI
x-i18n:
    generated_at: "2026-04-25T13:57:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d36801439b9243ea5cc0ab93757dde23d1ecd86c8f5b991541ee14f41bf05ac
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Utilisez `--non-interactive` pour automatiser `openclaw onboard`.

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` (et `--workspace`) pour les scripts.
</Note>

## Exemple de base en mode non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Ajoutez `--json` pour un résumé lisible par machine.

Utilisez `--skip-bootstrap` lorsque votre automatisation préinitialise les fichiers de l’espace de travail et ne souhaite pas que l’onboarding crée les fichiers d’amorçage par défaut.

Utilisez `--secret-input-mode ref` pour stocker des références adossées à des variables d’environnement dans les profils d’authentification au lieu de valeurs en clair.
La sélection interactive entre les références d’environnement et les références de fournisseur configurées (`file` ou `exec`) est disponible dans le flux d’onboarding.

En mode `ref` non interactif, les variables d’environnement du fournisseur doivent être définies dans l’environnement du processus.
Le passage de drapeaux de clé en ligne sans la variable d’environnement correspondante échoue désormais immédiatement.

Exemple :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Exemples spécifiques aux fournisseurs

<AccordionGroup>
  <Accordion title="Exemple de clé API Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Remplacez par `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` pour le catalogue Go.
  </Accordion>
  <Accordion title="Exemple Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemple de fournisseur personnalisé">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` est facultatif. S’il est omis, l’onboarding vérifie `CUSTOM_API_KEY`.

    Variante en mode ref :

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    Dans ce mode, l’onboarding stocke `apiKey` comme `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Le setup-token Anthropic reste disponible comme chemin de jeton d’onboarding pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI lorsqu’elle est disponible.
Pour la production, préférez une clé API Anthropic.

## Ajouter un autre agent

Utilisez `openclaw agents add <name>` pour créer un agent distinct avec son propre espace de travail,
ses sessions et ses profils d’authentification. Une exécution sans `--workspace` lance l’assistant.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Ce que cela configure :

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Remarques :

- Les espaces de travail par défaut suivent le modèle `~/.openclaw/workspace-<agentId>`.
- Ajoutez des `bindings` pour acheminer les messages entrants (l’assistant peut le faire).
- Drapeaux non interactifs : `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Documentation connexe

- Hub d’onboarding : [Onboarding (CLI)](/fr/start/wizard)
- Référence complète : [Référence de configuration CLI](/fr/start/wizard-cli-reference)
- Référence de commande : [`openclaw onboard`](/fr/cli/onboard)
