---
read_when:
    - Você está automatizando a integração inicial em scripts ou CI
    - Você precisa de exemplos não interativos para provedores específicos
sidebarTitle: CLI automation
summary: Onboarding com script e configuração de agentes para a CLI do OpenClaw
title: Automação da CLI
x-i18n:
    generated_at: "2026-07-12T15:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Use `openclaw onboard --non-interactive` para automatizar a configuração. Ele exige `--accept-risk`: a configuração não interativa pode gravar credenciais e a configuração do daemon sem uma solicitação de confirmação, portanto, a flag representa o reconhecimento explícito do risco.

<Note>
`--json` não implica o modo não interativo. Passe `--non-interactive --accept-risk` explicitamente em scripts.
</Note>

## Exemplo básico não interativo

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

Adicione `--json` para obter um resumo legível por máquina.

- O padrão de `--gateway-port` é `18789`; passe essa opção somente para substituí-lo.
- `--skip-bootstrap` ignora a criação dos arquivos padrão do espaço de trabalho, para automações que preenchem previamente seu próprio espaço de trabalho.
- `--secret-input-mode ref` armazena no perfil de autenticação uma referência baseada em variável de ambiente (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) em vez da chave em texto simples. No modo `ref` não interativo, a variável de ambiente do provedor já deve estar definida no ambiente do processo: passar uma flag de chave embutida sem a variável de ambiente correspondente causa uma falha imediata.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Exemplos específicos de provedores

<AccordionGroup>
  <Accordion title="Exemplo de chave de API da Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Cloudflare AI Gateway">
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
  <Accordion title="Exemplo do Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Substitua por `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para usar o catálogo Go.
  </Accordion>
  <Accordion title="Exemplo do Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo do Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo da Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Exemplo de provedor personalizado">
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

    `--custom-api-key` é opcional; alguns endpoints não exigem autenticação. Se for omitida, a integração inicial verifica `CUSTOM_API_KEY` no ambiente. `--custom-provider-id` é opcional e, quando omitida, é derivada automaticamente da URL base. O padrão de `--custom-compatibility` é `openai` (outros valores: `openai-responses`, `anthropic`).

    O OpenClaw infere o suporte à entrada de imagens com base em padrões conhecidos de IDs de modelos de visão (`gpt-4o`, `claude-3/4`, `gemini`, sufixos `-vl`/`vision` e semelhantes). Adicione `--custom-image-input` para ativá-lo à força em um modelo de visão não reconhecido ou `--custom-text-input` para forçar somente texto.

    Variante do modo de referência, que armazena `apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

A autenticação por token de configuração da Anthropic continua compatível, mas o OpenClaw prefere reutilizar a CLI do Claude quando há um login local disponível nela. Para produção, prefira uma chave de API da Anthropic.

## Adicionar outro agente

`openclaw agents add <name>` cria um agente separado, com seu próprio espaço de trabalho, suas próprias sessões e seus próprios perfis de autenticação. Executá-lo sem `--workspace` (e sem outras flags) inicia o assistente interativo; passar qualquer uma das opções `--workspace`, `--model`, `--agent-dir`, `--bind` ou `--non-interactive` o executa de forma não interativa e, nesse caso, exige `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Chaves de configuração que ele grava (entrada em `agents.list[]` para o ID do novo agente):

- `name`
- `workspace`
- `agentDir`
- `model` (somente quando `--model` é passada)

Observações:

- Espaço de trabalho padrão (quando `--workspace` é omitida no assistente interativo): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` pode ser repetida; adicione vinculações para encaminhar mensagens recebidas ao novo agente (o assistente também pode fazer isso de forma interativa).
- O nome do agente é normalizado para um ID de agente válido; `main` é reservado.

## Documentação relacionada

- Central de integração inicial: [Integração inicial (CLI)](/pt-BR/start/wizard)
- Referência completa: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference)
- Referência do comando: [`openclaw onboard`](/pt-BR/cli/onboard)
