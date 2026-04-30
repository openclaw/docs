---
read_when:
    - Você quer uma configuração guiada para Gateway, espaço de trabalho, autenticação, canais e Skills
summary: Referência da CLI para `openclaw onboard` (integração interativa)
title: Integrar
x-i18n:
    generated_at: "2026-04-30T09:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding interativo para configuração de Gateway local ou remoto.

## Guias relacionados

<CardGroup cols={2}>
  <Card title="Hub de onboarding da CLI" href="/pt-BR/start/wizard" icon="rocket">
    Passo a passo do fluxo interativo da CLI.
  </Card>
  <Card title="Visão geral do onboarding" href="/pt-BR/start/onboarding-overview" icon="map">
    Como o onboarding do OpenClaw se encaixa.
  </Card>
  <Card title="Referência de configuração da CLI" href="/pt-BR/start/wizard-cli-reference" icon="book">
    Saídas, detalhes internos e comportamento por etapa.
  </Card>
  <Card title="Automação da CLI" href="/pt-BR/start/wizard-cli-automation" icon="terminal">
    Flags não interativas e configurações com scripts.
  </Card>
  <Card title="Onboarding do app para macOS" href="/pt-BR/start/onboarding" icon="apple">
    Fluxo de onboarding para o app da barra de menus do macOS.
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

`--flow import` usa provedores de migração pertencentes a Plugins, como Hermes. Ele só é executado em uma configuração nova do OpenClaw; se já houver configuração, credenciais, sessões ou arquivos de memória/identidade do workspace, redefina ou escolha uma configuração nova antes de importar.

`--modern` inicia a prévia de onboarding conversacional do Crestodian. Sem
`--modern`, `openclaw onboard` mantém o fluxo de onboarding clássico.

Para destinos `ws://` em redes privadas de texto simples (somente redes confiáveis), defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de onboarding.
Não há equivalente em `openclaw.json` para esse mecanismo emergencial de transporte
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

`--custom-api-key` é opcional no modo não interativo. Se omitido, o onboarding verifica `CUSTOM_API_KEY`.
O OpenClaw marca automaticamente IDs comuns de modelos de visão como compatíveis com imagem. Passe `--custom-image-input` para IDs personalizados desconhecidos de visão, ou `--custom-text-input` para forçar metadados somente de texto.

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

`--custom-base-url` usa `http://127.0.0.1:11434` por padrão. `--custom-model-id` é opcional; se omitido, o onboarding usa os padrões sugeridos pelo Ollama. IDs de modelos em nuvem, como `kimi-k2.5:cloud`, também funcionam aqui.

Armazene chaves de provedor como refs em vez de texto simples:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, o onboarding grava refs baseadas em env em vez de valores de chave em texto simples.
Para provedores baseados em perfis de autenticação, isso grava entradas `keyRef`; para provedores personalizados, isso grava `models.providers.<id>.apiKey` como uma ref de env (por exemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo `ref` não interativo:

- Defina a variável de ambiente do provedor no ambiente do processo de onboarding (por exemplo, `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo, `--openai-api-key`) a menos que essa variável de ambiente também esteja definida.
- Se uma flag de chave inline for passada sem a variável de ambiente exigida, o onboarding falhará rapidamente com orientação.

Opções de token do Gateway no modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como uma SecretRef de env.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- `--gateway-token-ref-env` exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
- Com `--install-daemon`, quando a autenticação por token exige um token, tokens de Gateway gerenciados por SecretRef são validados, mas não persistidos como texto simples resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo de token exigir um token e a SecretRef de token configurada não for resolvida, o onboarding falhará fechado com orientação de correção.
- Com `--install-daemon`, se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o onboarding bloqueará a instalação até que o modo seja definido explicitamente.
- O onboarding local grava `gateway.mode="local"` na configuração. Se um arquivo de configuração posterior estiver sem `gateway.mode`, trate isso como dano de configuração ou uma edição manual incompleta, não como um atalho válido de modo local.
- `--allow-unconfigured` é uma alternativa de escape separada do runtime do Gateway. Isso não significa que o onboarding possa omitir `gateway.mode`.

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

Integridade do Gateway local não interativo:

- A menos que você passe `--skip-health`, o onboarding aguarda um gateway local alcançável antes de sair com sucesso.
- `--install-daemon` inicia primeiro o caminho de instalação do Gateway gerenciado. Sem ele, você já precisa ter um Gateway local em execução, por exemplo `openclaw gateway run`.
- Se você quer apenas gravações de configuração/workspace/bootstrap na automação, use `--skip-health`.
- Se você gerencia arquivos de workspace por conta própria, passe `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` e pular a criação de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- No Windows nativo, `--install-daemon` tenta primeiro as Tarefas Agendadas e volta para um item de login por usuário na pasta de Inicialização se a criação da tarefa for negada.

Comportamento de onboarding interativo com modo de referência:

- Escolha **Usar referência de segredo** quando solicitado.
- Depois escolha:
  - Variável de ambiente
  - Provedor de segredo configurado (`file` ou `exec`)
- O onboarding executa uma validação preflight rápida antes de salvar a ref.
  - Se a validação falhar, o onboarding mostra o erro e permite tentar novamente.

### Escolhas de endpoint Z.AI não interativas

<Note>
`--auth-choice zai-api-key` detecta automaticamente o melhor endpoint da Z.AI para sua chave (prefere a API geral com `zai/glm-5.1`). Se você quer especificamente os endpoints do GLM Coding Plan, escolha `zai-coding-global` ou `zai-coding-cn`.
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

Exemplo não interativo do Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Observações de fluxo

<AccordionGroup>
  <Accordion title="Tipos de fluxo">
    - `quickstart`: prompts mínimos, gera automaticamente um token de Gateway.
    - `manual`: prompts completos para porta, bind e auth (alias de `advanced`).
    - `import`: executa um provedor de migração detectado, pré-visualiza o plano e, em seguida, aplica após a confirmação.

  </Accordion>
  <Accordion title="Pré-filtragem de provedores">
    Quando uma escolha de auth implica um provedor preferido, o onboarding pré-filtra os seletores de modelo padrão e allowlist para esse provedor. Para Volcengine e BytePlus, isso também corresponde às variantes de plano de codificação (`volcengine-plan/*`, `byteplus-plan/*`).

    Se o filtro de provedor preferido ainda não produzir modelos carregados, o onboarding recorre ao catálogo sem filtro em vez de deixar o seletor vazio.

  </Accordion>
  <Accordion title="Acompanhamentos de busca na web">
    Alguns provedores de busca na web acionam prompts de acompanhamento específicos do provedor:

    - **Grok** pode oferecer uma configuração opcional de `x_search` com o mesmo `XAI_API_KEY` e uma escolha de modelo `x_search`.
    - **Kimi** pode pedir a região da API da Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e o modelo padrão de busca na web do Kimi.

  </Accordion>
  <Accordion title="Outros comportamentos">
    - Comportamento de escopo de DM do onboarding local: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals).
    - Primeiro chat mais rápido: `openclaw dashboard` (UI de controle, sem configuração de canal).
    - Provedor personalizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic, incluindo provedores hospedados não listados. Use Unknown para detectar automaticamente.
    - Se o estado do Hermes for detectado, o onboarding oferece um fluxo de migração. Use [Migrar](/pt-BR/cli/migrate) para planos de dry-run, modo de sobrescrita, relatórios e mapeamentos exatos.

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
