---
read_when:
    - Vous automatisez l’intégration dans des scripts ou une CI
    - Vous avez besoin d’exemples non interactifs pour des fournisseurs spécifiques
sidebarTitle: CLI automation
summary: Intégration scriptée et configuration de l’agent pour la CLI OpenClaw
title: Automatisation de la CLI
x-i18n:
    generated_at: "2026-07-12T15:55:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Utilisez `openclaw onboard --non-interactive` pour automatiser la configuration par script. Cette commande nécessite `--accept-risk` : la configuration non interactive peut écrire des identifiants et la configuration du démon sans demander de confirmation ; cette option constitue donc l’acceptation explicite du risque.

<Note>
`--json` n’active pas le mode non interactif. Pour les scripts, transmettez explicitement `--non-interactive --accept-risk`.
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

- `--gateway-port` utilise `18789` par défaut ; ne le transmettez que pour remplacer cette valeur.
- `--skip-bootstrap` ignore la création des fichiers d’espace de travail par défaut, pour les automatisations qui préremplissent leur propre espace de travail.
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
    Utilisez plutôt `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` pour le catalogue Go.
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

    `--custom-api-key` est facultatif ; certains points de terminaison ne nécessitent pas d’authentification. Si cette option est omise, le processus d’intégration recherche `CUSTOM_API_KEY` dans l’environnement. `--custom-provider-id` est facultatif et, s’il est omis, sa valeur est dérivée automatiquement de l’URL de base. `--custom-compatibility` utilise `openai` par défaut (autres valeurs : `openai-responses`, `anthropic`).

    OpenClaw déduit la prise en charge des images en entrée à partir de motifs connus d’identifiants de modèles de vision (`gpt-4o`, `claude-3/4`, `gemini`, suffixes `-vl`/`vision` et motifs similaires). Ajoutez `--custom-image-input` pour l’activer de force avec un modèle de vision non reconnu, ou `--custom-text-input` pour imposer un fonctionnement limité au texte.

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

L’authentification par jeton de configuration Anthropic reste prise en charge, mais OpenClaw privilégie la réutilisation de la CLI Claude lorsqu’une connexion locale à celle-ci est disponible. Pour la production, privilégiez une clé d’API Anthropic.

## Ajouter un autre agent

`openclaw agents add <name>` crée un agent distinct avec son propre espace de travail, ses propres sessions et ses propres profils d’authentification. L’exécuter sans `--workspace` (ni aucune autre option) lance l’assistant interactif ; la transmission de l’une des options `--workspace`, `--model`, `--agent-dir`, `--bind` ou `--non-interactive` l’exécute en mode non interactif et rend alors `--workspace` obligatoire.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Clés de configuration écrites (`agents.list[]` contient une entrée pour l’identifiant du nouvel agent) :

- `name`
- `workspace`
- `agentDir`
- `model` (uniquement lorsque `--model` est transmis)

Remarques :

- Espace de travail par défaut (lorsque `--workspace` est omis dans l’assistant interactif) : `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` peut être répété ; ajoutez des liaisons afin d’acheminer les messages entrants vers le nouvel agent (l’assistant permet également de le faire de manière interactive).
- Le nom de l’agent est normalisé en un identifiant d’agent valide ; `main` est réservé.

## Documentation associée

- Portail d’intégration : [Intégration (CLI)](/fr/start/wizard)
- Référence complète : [Référence de configuration de la CLI](/fr/start/wizard-cli-reference)
- Référence de la commande : [`openclaw onboard`](/fr/cli/onboard)
