---
read_when:
    - Você quer uma configuração guiada para Gateway, workspace, autenticação, canais e Skills
summary: Referência da CLI para `openclaw onboard` (onboarding interativo)
title: Onboard
x-i18n:
    generated_at: "2026-04-25T13:44:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interativo para configuração local ou remota do Gateway.

## Guias relacionados

- Hub de onboarding da CLI: [Onboarding (CLI)](/pt-BR/start/wizard)
- Visão geral do onboarding: [Visão geral do onboarding](/pt-BR/start/onboarding-overview)
- Referência de onboarding da CLI: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference)
- Automação da CLI: [Automação da CLI](/pt-BR/start/wizard-cli-automation)
- Onboarding no macOS: [Onboarding (app do macOS)](/pt-BR/start/onboarding)

## Exemplos

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` inicia a prévia de onboarding conversacional do Crestodian. Sem
`--modern`, `openclaw onboard` mantém o fluxo clássico de onboarding.

Para destinos `ws://` em rede privada em texto simples (apenas redes confiáveis), defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de onboarding.
Não existe equivalente em `openclaw.json` para essa medida emergencial
do lado do cliente para transporte.

Provedor personalizado não interativo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` é opcional no modo não interativo. Se omitido, o onboarding verifica `CUSTOM_API_KEY`.

O LM Studio também oferece suporte a uma flag de chave específica do provedor no modo não interativo:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama não interativo:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` usa `http://127.0.0.1:11434` como padrão. `--custom-model-id` é opcional; se omitido, o onboarding usa os padrões sugeridos pelo Ollama. IDs de modelo em nuvem como `kimi-k2.5:cloud` também funcionam aqui.

Armazene chaves de provedor como refs em vez de texto simples:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, o onboarding grava refs baseadas em env em vez de valores de chave em texto simples.
Para provedores baseados em perfil de autenticação, isso grava entradas `keyRef`; para provedores personalizados, isso grava `models.providers.<id>.apiKey` como uma ref env (por exemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo `ref` não interativo:

- Defina a variável de ambiente do provedor no ambiente do processo de onboarding (por exemplo, `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo, `--openai-api-key`), a menos que essa variável de ambiente também esteja definida.
- Se uma flag de chave inline for passada sem a variável de ambiente exigida, o onboarding falhará imediatamente com orientações.

Opções de token do Gateway no modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como uma SecretRef env.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- `--gateway-token-ref-env` exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
- Com `--install-daemon`, quando a autenticação por token exige um token, tokens do Gateway gerenciados por SecretRef são validados, mas não persistidos como texto simples resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo de token exigir um token e a SecretRef de token configurada do Gateway não puder ser resolvida, o onboarding falha em modo fechado com orientações de correção.
- Com `--install-daemon`, se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o onboarding bloqueia a instalação até que o modo seja definido explicitamente.
- O onboarding local grava `gateway.mode="local"` na configuração. Se um arquivo de configuração posterior não tiver `gateway.mode`, trate isso como dano na configuração ou uma edição manual incompleta, e não como um atalho válido para o modo local.
- `--allow-unconfigured` é uma medida emergencial separada do runtime do Gateway. Isso não significa que o onboarding pode omitir `gateway.mode`.

Exemplo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Integridade do Gateway local no modo não interativo:

- A menos que você passe `--skip-health`, o onboarding espera por um Gateway local acessível antes de sair com sucesso.
- `--install-daemon` inicia primeiro o caminho de instalação gerenciada do Gateway. Sem ele, você já deve ter um Gateway local em execução, por exemplo `openclaw gateway run`.
- Se você quiser apenas gravações de configuração/workspace/bootstrap na automação, use `--skip-health`.
- Se você gerencia os arquivos do workspace por conta própria, passe `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` e pular a criação de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- No Windows nativo, `--install-daemon` tenta primeiro Tarefas Agendadas e faz fallback para um item de login por usuário na pasta Inicializar se a criação da tarefa for negada.

Comportamento do onboarding interativo com modo de referência:

- Escolha **Usar referência de segredo** quando solicitado.
- Em seguida, escolha uma das opções:
  - Variável de ambiente
  - Provedor de segredo configurado (`file` ou `exec`)
- O onboarding executa uma validação rápida de preflight antes de salvar a ref.
  - Se a validação falhar, o onboarding mostra o erro e permite tentar novamente.

Opções de endpoint Z.AI no modo não interativo:

Observação: `--auth-choice zai-api-key` agora detecta automaticamente o melhor endpoint Z.AI para sua chave (prefere a API geral com `zai/glm-5.1`).
Se você quiser especificamente os endpoints do GLM Coding Plan, escolha `zai-coding-global` ou `zai-coding-cn`.

```bash
# Seleção de endpoint sem prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Outras opções de endpoint Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Exemplo não interativo do Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Observações sobre fluxos:

- `quickstart`: prompts mínimos, gera automaticamente um token do Gateway.
- `manual`: prompts completos para porta/bind/autenticação (alias de `advanced`).
- Quando uma escolha de autenticação implica um provedor preferencial, o onboarding pré-filtra os seletores de modelo padrão e de allowlist para esse provedor. Para Volcengine e BytePlus, isso também corresponde às variantes de coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).
- Se o filtro de provedor preferencial não produzir nenhum modelo carregado ainda, o onboarding usa como fallback o catálogo sem filtro em vez de deixar o seletor vazio.
- Na etapa de busca na web, alguns provedores podem acionar prompts complementares específicos do provedor:
  - **Grok** pode oferecer configuração opcional de `x_search` com a mesma `XAI_API_KEY` e uma escolha de modelo `x_search`.
  - **Kimi** pode solicitar a região da API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e o modelo padrão de busca na web do Kimi.
- Comportamento do escopo de DM no onboarding local: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals).
- Primeiro chat mais rápido: `openclaw dashboard` (Control UI, sem configuração de canal).
- Provedor personalizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic, incluindo provedores hospedados não listados. Use Unknown para detecção automática.

## Comandos comuns de acompanhamento

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` para scripts.
</Note>
