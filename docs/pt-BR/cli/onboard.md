---
read_when:
    - Você quer uma configuração guiada para Gateway, espaço de trabalho, autenticação, canais e Skills
summary: Referência da CLI para `openclaw onboard` (configuração inicial interativa)
title: Integrar
x-i18n:
    generated_at: "2026-05-02T05:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Integração inicial interativa para configuração de Gateway local ou remoto.

## Guias relacionados

<CardGroup cols={2}>
  <Card title="Hub de integração inicial da CLI" href="/pt-BR/start/wizard" icon="rocket">
    Passo a passo do fluxo interativo da CLI.
  </Card>
  <Card title="Visão geral da integração inicial" href="/pt-BR/start/onboarding-overview" icon="map">
    Como a integração inicial do OpenClaw se encaixa.
  </Card>
  <Card title="Referência de configuração da CLI" href="/pt-BR/start/wizard-cli-reference" icon="book">
    Saídas, detalhes internos e comportamento por etapa.
  </Card>
  <Card title="Automação da CLI" href="/pt-BR/start/wizard-cli-automation" icon="terminal">
    Flags não interativas e configurações via script.
  </Card>
  <Card title="Integração inicial do app para macOS" href="/pt-BR/start/onboarding" icon="apple">
    Fluxo de integração inicial para o app de barra de menu do macOS.
  </Card>
</CardGroup>

## Exemplos

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` usa provedores de migração pertencentes a plugins, como Hermes. Ele só é executado em uma configuração nova do OpenClaw; se arquivos existentes de configuração, credenciais, sessões ou memória/identidade do workspace estiverem presentes, redefina ou escolha uma configuração nova antes de importar.

`--modern` inicia a prévia de integração inicial conversacional do Crestodian. Sem
`--modern`, `openclaw onboard` mantém o fluxo clássico de integração inicial.

Para destinos `ws://` de rede privada em texto simples (apenas redes confiáveis), defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de integração inicial.
Não há equivalente em `openclaw.json` para esse recurso de emergência do transporte
do lado do cliente.

Provedor personalizado não interativo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` é opcional no modo não interativo. Se omitida, a integração inicial verifica `CUSTOM_API_KEY`.
O OpenClaw marca automaticamente IDs comuns de modelos de visão como compatíveis com imagens. Passe `--custom-image-input` para IDs personalizados de visão desconhecidos, ou `--custom-text-input` para forçar metadados apenas de texto.

O LM Studio também aceita uma flag de chave específica do provedor no modo não interativo:

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

`--custom-base-url` usa `http://127.0.0.1:11434` por padrão. `--custom-model-id` é opcional; se omitida, a integração inicial usa os padrões sugeridos pelo Ollama. IDs de modelos em nuvem, como `kimi-k2.5:cloud`, também funcionam aqui.

Armazene chaves de provedor como refs em vez de texto simples:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, a integração inicial grava refs respaldadas por env em vez de valores de chave em texto simples.
Para provedores respaldados por perfis de autenticação, isso grava entradas `keyRef`; para provedores personalizados, isso grava `models.providers.<id>.apiKey` como uma ref de env (por exemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo `ref` não interativo:

- Defina a variável de ambiente do provedor no ambiente do processo de integração inicial (por exemplo, `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo, `--openai-api-key`), a menos que essa variável de ambiente também esteja definida.
- Se uma flag de chave inline for passada sem a variável de ambiente exigida, a integração inicial falhará rapidamente com orientação.

Opções de token do Gateway no modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como uma SecretRef de env.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivas.
- `--gateway-token-ref-env` exige uma variável de ambiente não vazia no ambiente do processo de integração inicial.
- Com `--install-daemon`, quando a autenticação por token exige um token, tokens de gateway gerenciados por SecretRef são validados, mas não persistidos como texto simples resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo de token exigir um token e a SecretRef de token configurada não for resolvida, a integração inicial falhará fechada com orientação de correção.
- Com `--install-daemon`, se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a integração inicial bloqueará a instalação até que o modo seja definido explicitamente.
- A integração inicial local grava `gateway.mode="local"` na configuração. Se um arquivo de configuração posterior não tiver `gateway.mode`, trate isso como configuração danificada ou uma edição manual incompleta, não como um atalho válido para o modo local.
- A integração inicial local instala plugins baixáveis selecionados quando o caminho de configuração escolhido exige isso.
- A integração inicial remota grava apenas informações de conexão para o Gateway remoto e não instala pacotes de plugin locais.
- `--allow-unconfigured` é uma brecha separada do runtime do gateway. Ela não significa que a integração inicial possa omitir `gateway.mode`.

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

Saúde do gateway local não interativo:

- A menos que você passe `--skip-health`, a integração inicial aguarda um gateway local acessível antes de sair com sucesso.
- `--install-daemon` inicia primeiro o caminho de instalação do gateway gerenciado. Sem isso, você já deve ter um gateway local em execução, por exemplo `openclaw gateway run`.
- Se você quiser apenas gravações de configuração/workspace/bootstrap em automação, use `--skip-health`.
- Se você gerencia os arquivos do workspace por conta própria, passe `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` e pular a criação de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- No Windows nativo, `--install-daemon` tenta primeiro Scheduled Tasks e recorre a um item de login na pasta Startup por usuário se a criação da tarefa for negada.

Comportamento da integração inicial interativa com modo de referência:

- Escolha **Usar referência de segredo** quando solicitado.
- Depois escolha uma das opções:
  - Variável de ambiente
  - Provedor de segredo configurado (`file` ou `exec`)
- A integração inicial executa uma validação rápida de preflight antes de salvar a ref.
  - Se a validação falhar, a integração inicial mostra o erro e permite tentar novamente.

### Escolhas de endpoint Z.AI não interativas

<Note>
`--auth-choice zai-api-key` detecta automaticamente o melhor endpoint Z.AI para sua chave (prefere a API geral com `zai/glm-5.1`). Se você quiser especificamente os endpoints do GLM Coding Plan, escolha `zai-coding-global` ou `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Exemplo Mistral não interativo:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Notas de fluxo

<AccordionGroup>
  <Accordion title="Tipos de fluxo">
    - `quickstart`: prompts mínimos, gera automaticamente um token de gateway.
    - `manual`: prompts completos para porta, bind e autenticação (alias de `advanced`).
    - `import`: executa um provedor de migração detectado, pré-visualiza o plano e então aplica após confirmação.

  </Accordion>
  <Accordion title="Pré-filtragem de provedores">
    Quando uma escolha de autenticação implica um provedor preferencial, a integração inicial pré-filtra os seletores de modelo padrão e allowlist para esse provedor. Para Volcengine e BytePlus, isso também corresponde às variantes de coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se o filtro de provedor preferencial ainda não produzir modelos carregados, a integração inicial recorre ao catálogo sem filtro em vez de deixar o seletor vazio.

  </Accordion>
  <Accordion title="Acompanhamentos de pesquisa na web">
    Alguns provedores de pesquisa na web acionam prompts de acompanhamento específicos do provedor:

    - **Grok** pode oferecer configuração opcional de `x_search` com a mesma `XAI_API_KEY` e uma escolha de modelo `x_search`.
    - **Kimi** pode perguntar a região da API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e o modelo padrão de pesquisa na web da Kimi.

  </Accordion>
  <Accordion title="Outros comportamentos">
    - Comportamento de escopo de DM da integração inicial local: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals).
    - Primeiro chat mais rápido: `openclaw dashboard` (Control UI, sem configuração de canal).
    - Provedor personalizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic, incluindo provedores hospedados não listados. Use Unknown para detectar automaticamente.
    - Se o estado do Hermes for detectado, a integração inicial oferece um fluxo de migração. Use [Migrar](/pt-BR/cli/migrate) para planos de dry-run, modo de sobrescrita, relatórios e mapeamentos exatos.

  </Accordion>
</AccordionGroup>

## Comandos comuns de acompanhamento

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` para scripts.
</Note>
