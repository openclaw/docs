---
read_when:
    - Você está automatizando o onboarding em scripts ou CI
    - Você precisa de exemplos não interativos para providers específicos
sidebarTitle: CLI automation
summary: Onboarding com script e configuração de agente para a CLI do OpenClaw
title: Automação da CLI
x-i18n:
    generated_at: "2026-04-25T18:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Use `--non-interactive` para automatizar `openclaw onboard`.

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` (e `--workspace`) em scripts.
</Note>

## Exemplo básico não interativo

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

Adicione `--json` para um resumo legível por máquina.

Use `--skip-bootstrap` quando sua automação pré-preencher arquivos do workspace e não quiser que o onboarding crie os arquivos bootstrap padrão.

Use `--secret-input-mode ref` para armazenar refs baseadas em variáveis de ambiente em perfis de autenticação em vez de valores em texto simples.
A seleção interativa entre refs de ambiente e refs de provider configuradas (`file` ou `exec`) está disponível no fluxo de onboarding.

No modo `ref` não interativo, as variáveis de ambiente do provider devem estar definidas no ambiente do processo.
Passar flags inline de chave sem a variável de ambiente correspondente agora falha imediatamente.

Exemplo:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Exemplos específicos por provider

<AccordionGroup>
  <Accordion title="Exemplo de chave de API da Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Cloudflare AI Gateway">
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
  <Accordion title="Exemplo do Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Troque para `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para o catálogo Go.
  </Accordion>
  <Accordion title="Exemplo do Ollama">
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
  <Accordion title="Exemplo de provider personalizado">
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

    `--custom-api-key` é opcional. Se omitido, o onboarding verifica `CUSTOM_API_KEY`.

    Variante em modo ref:

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

    Nesse modo, o onboarding armazena `apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

O token de configuração da Anthropic continua disponível como um caminho compatível de token de onboarding, mas o OpenClaw agora prefere reutilizar a CLI do Claude quando disponível.
Para produção, prefira uma chave de API da Anthropic.

## Adicionar outro agente

Use `openclaw agents add <name>` para criar um agente separado com seu próprio workspace,
sessões e perfis de autenticação. Executar sem `--workspace` inicia o assistente.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

O que isso define:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Observações:

- Workspaces padrão seguem `~/.openclaw/workspace-<agentId>`.
- Adicione `bindings` para rotear mensagens recebidas (o assistente pode fazer isso).
- Flags não interativas: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Documentação relacionada

- Hub de onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Referência completa: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference)
- Referência de comando: [`openclaw onboard`](/pt-BR/cli/onboard)
