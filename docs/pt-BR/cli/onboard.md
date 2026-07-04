---
read_when:
    - Você quer uma configuração guiada para Gateway, workspace, autenticação, canais e Skills
summary: Referência da CLI para `openclaw onboard` (configuração inicial interativa)
title: Integrar
x-i18n:
    generated_at: "2026-07-04T20:28:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Integração guiada completa para configuração local ou remota do Gateway. Use isto quando quiser que o OpenClaw percorra autenticação de modelo, espaço de trabalho, gateway, canais, skills e integridade em um único fluxo.

## Guias relacionados

<CardGroup cols={2}>
  <Card title="Hub de integração da CLI" href="/pt-BR/start/wizard" icon="rocket">
    Passo a passo do fluxo interativo da CLI.
  </Card>
  <Card title="Visão geral da integração" href="/pt-BR/start/onboarding-overview" icon="map">
    Como a integração do OpenClaw se encaixa.
  </Card>
  <Card title="Referência de configuração da CLI" href="/pt-BR/start/wizard-cli-reference" icon="book">
    Saídas, detalhes internos e comportamento por etapa.
  </Card>
  <Card title="Automação da CLI" href="/pt-BR/start/wizard-cli-automation" icon="terminal">
    Flags não interativas e configurações por script.
  </Card>
  <Card title="Integração do app macOS" href="/pt-BR/start/onboarding" icon="apple">
    Fluxo de integração para o app da barra de menus do macOS.
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

`--flow import` usa provedores de migração pertencentes ao plugin, como Hermes. Ele só é executado em uma configuração nova do OpenClaw; se configurações, credenciais, sessões ou arquivos de memória/identidade do espaço de trabalho existentes estiverem presentes, redefina ou escolha uma configuração nova antes de importar.

`--modern` inicia a prévia de integração conversacional do Crestodian. Sem
`--modern`, `openclaw onboard` mantém o fluxo clássico de integração.

Em um terminal interativo, `openclaw` puro (sem subcomando) roteia pelo estado
da configuração:

- Se o arquivo de configuração ativo estiver ausente ou não tiver configurações autorais (vazio ou
  apenas metadados), ele inicia este fluxo clássico de integração.
- Se o arquivo de configuração existir, mas falhar na validação, ele inicia
  [Crestodian](/pt-BR/cli/crestodian) para reparo.
- Se o arquivo de configuração for válido, ele abre a TUI normal do agente, localmente
  ou conectada a um Gateway configurado acessível. Em uma instalação configurada,
  acesse o Crestodian com `/crestodian` dentro da TUI ou `openclaw crestodian`.

`ws://` em texto simples é aceito para loopback, literais de IP privado, `.local` e
URLs de gateway Tailnet `*.ts.net`. Para outros nomes DNS privados confiáveis, defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de integração.

## Localidade

A integração interativa usa a localidade do assistente da CLI para textos fixos de configuração. A ordem de resolução
é:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. fallback para inglês

As localidades compatíveis do assistente são `en`, `zh-CN` e `zh-TW`. Valores de localidade podem usar
sublinhado ou formas com sufixo POSIX, como `zh_CN.UTF-8`. Nomes de produtos, nomes de comandos, chaves
de configuração, URLs, IDs de provedor, IDs de modelo e rótulos de plugin/canal
permanecem literais.

Exemplo:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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

`--custom-api-key` é opcional no modo não interativo. Se omitido, a integração verifica `CUSTOM_API_KEY`.
O OpenClaw marca automaticamente IDs comuns de modelos de visão como compatíveis com imagem. Passe `--custom-image-input` para IDs de visão personalizados desconhecidos, ou `--custom-text-input` para forçar metadados somente texto.
Use `--custom-compatibility openai-responses` para endpoints compatíveis com OpenAI que dão suporte a `/v1/responses`, mas não a `/v1/chat/completions`.

O LM Studio também dá suporte a uma flag de chave específica do provedor no modo não interativo:

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

`--custom-base-url` usa `http://127.0.0.1:11434` por padrão. `--custom-model-id` é opcional; se omitido, a integração usa os padrões sugeridos do Ollama. IDs de modelos em nuvem, como `kimi-k2.5:cloud`, também funcionam aqui.

Armazene chaves de provedor como referências em vez de texto simples:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, a integração grava refs apoiadas por env em vez de valores de chave em texto simples.
Para provedores apoiados por auth-profile, isso grava entradas `keyRef`; para provedores personalizados, isso grava `models.providers.<id>.apiKey` como uma ref de env (por exemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo não interativo `ref`:

- Defina a variável de ambiente do provedor no ambiente do processo de integração (por exemplo, `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo, `--openai-api-key`), a menos que essa variável de ambiente também esteja definida.
- Se uma flag de chave inline for passada sem a variável de ambiente exigida, a integração falha rapidamente com orientação.

Opções de token do Gateway no modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como um SecretRef de env.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- `--gateway-token-ref-env` exige uma variável de ambiente não vazia no ambiente do processo de integração.
- Com `--install-daemon`, quando a autenticação por token exige um token, tokens de gateway gerenciados por SecretRef são validados, mas não persistidos como texto simples resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo de token exigir um token e o SecretRef de token configurado estiver não resolvido, a integração falha fechada com orientação de correção.
- Com `--install-daemon`, se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a integração bloqueia a instalação até que o modo seja definido explicitamente.
- A integração local grava `gateway.mode="local"` na configuração. Se um arquivo de configuração posterior estiver sem `gateway.mode`, trate isso como dano de configuração ou uma edição manual incompleta, não como um atalho válido de modo local.
- A integração local instala plugins baixáveis selecionados quando o caminho de configuração escolhido os exige.
- A integração remota grava apenas informações de conexão para o Gateway remoto e não instala pacotes de plugins locais.
- `--allow-unconfigured` é uma escotilha de escape separada do runtime do gateway. Ela não significa que a integração possa omitir `gateway.mode`.

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

Integridade do gateway local não interativo:

- A menos que você passe `--skip-health`, a integração espera por um gateway local acessível antes de sair com sucesso.
- `--install-daemon` inicia primeiro o caminho de instalação do gateway gerenciado. Sem ele, você já deve ter um gateway local em execução, por exemplo `openclaw gateway run`.
- Se você quer apenas gravações de configuração/espaço de trabalho/bootstrap na automação, use `--skip-health`.
- Se você gerencia arquivos do espaço de trabalho por conta própria, passe `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` e pular a criação de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- No Windows nativo, `--install-daemon` tenta primeiro Tarefas Agendadas e recorre a um item de login na pasta Inicializar por usuário se a criação da tarefa for negada.

Comportamento da integração interativa com modo de referência:

- Escolha **Usar referência de segredo** quando solicitado.
- Depois escolha uma destas opções:
  - Variável de ambiente
  - Provedor de segredo configurado (`file` ou `exec`)
- A integração executa uma validação de preflight rápida antes de salvar a ref.
  - Se a validação falhar, a integração mostra o erro e permite tentar novamente.

### Opções de endpoint Z.AI não interativas

<Note>
`--auth-choice zai-api-key` detecta automaticamente o melhor endpoint e modelo Z.AI para
sua chave. Endpoints do Coding Plan preferem `zai/glm-5.2`; endpoints de API geral usam
`zai/glm-5.1`. Para forçar um endpoint do Coding Plan, escolha `zai-coding-global` ou
`zai-coding-cn`.
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

## Flags não interativas adicionais

Autenticação de modelo baseada em token (não interativa; usada com `--auth-choice token`):

- `--token-provider <id>` — ID do provedor de token. Identifica qual provedor emite o token.
- `--token <token>` — Valor do token para autenticação de modelo.
- `--token-profile-id <id>` — ID do perfil de autenticação. O armazenamento genérico de token usa `<provider>:manual` por padrão; fluxos de configuração pertencentes ao provedor podem usar seu próprio padrão, como `anthropic:default`.
- `--token-expires-in <duration>` — Duração opcional de expiração do token (por exemplo, `365d`, `12h`).

Cloudflare AI Gateway (não interativo):

- `--cloudflare-ai-gateway-account-id <id>` — ID da conta Cloudflare para roteamento pelo Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID do Cloudflare AI Gateway.

Controle de instalação do daemon:

- `--no-install-daemon` — Pular explicitamente a instalação do serviço de gateway.
- `--skip-daemon` — Alias para `--no-install-daemon`.

Controle de configuração da UI e de hooks:

- `--skip-ui` — Pular prompts da Control UI / TUI durante a integração.
- `--skip-hooks` — Pular prompts de webhook / hook durante a integração.

Supressão de saída:

- `--suppress-gateway-token-output` — Suprime saída do Gateway/UI que contém token (dicas de token, URL de login automático com token incorporado e inicialização automática da Control UI). Útil em ambientes de terminal compartilhado e CI.

## Notas de fluxo

<AccordionGroup>
  <Accordion title="Tipos de fluxo">
    - `quickstart`: prompts mínimos, gera automaticamente um token de gateway.
    - `manual`: prompts completos para porta, bind e autenticação (alias de `advanced`).
    - `import`: executa um provedor de migração detectado, pré-visualiza o plano e então aplica após confirmação.

  </Accordion>
  <Accordion title="Pré-filtragem de provedores">
    Quando uma escolha de autenticação implica um provedor preferencial, a integração pré-filtra os seletores de modelo padrão e allowlist para esse provedor. Para Volcengine e BytePlus, isso também corresponde às variantes de plano de codificação (`volcengine-plan/*`, `byteplus-plan/*`).

    Se o filtro de provedor preferencial ainda não produzir modelos carregados, a integração recorre ao catálogo não filtrado em vez de deixar o seletor vazio.

  </Accordion>
  <Accordion title="Acompanhamentos de pesquisa na web">
    Alguns provedores de pesquisa na web acionam prompts de acompanhamento específicos do provedor:

    - **Grok** pode oferecer configuração opcional de `x_search` com o mesmo perfil OAuth xAI ou chave de API e uma escolha de modelo `x_search`.
    - **Kimi** pode perguntar pela região da API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e pelo modelo padrão de pesquisa na web Kimi.

  </Accordion>
  <Accordion title="Outros comportamentos">
    - Comportamento de escopo de DM na integração local: [referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals).
    - Primeiro chat mais rápido: `openclaw dashboard` (Control UI, sem configuração de canal).
    - Provedor personalizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic, incluindo provedores hospedados não listados. Use Unknown para detectar automaticamente.
    - Se o estado do Hermes for detectado, a integração oferece um fluxo de migração. Use [Migrate](/pt-BR/cli/migrate) para planos dry-run, modo de sobrescrita, relatórios e mapeamentos exatos.

  </Accordion>
</AccordionGroup>

## Comandos comuns de acompanhamento

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Use `openclaw setup` como o mesmo ponto de entrada guiado de onboarding. Use `openclaw setup --baseline` quando você precisar apenas da configuração/workspace de baseline, `openclaw configure` depois para alterações direcionadas, e `openclaw channels add` para configuração somente de canais.

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` em scripts.
</Note>
