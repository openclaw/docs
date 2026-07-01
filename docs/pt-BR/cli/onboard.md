---
read_when:
    - Você quer configuração guiada para gateway, espaço de trabalho, autenticação, canais e Skills
summary: Referência da CLI para `openclaw onboard` (integração interativa)
title: Integrar
x-i18n:
    generated_at: "2026-07-01T12:52:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Integração inicial guiada completa para configuração local ou remota do Gateway. Use isto quando quiser que o OpenClaw percorra autenticação de modelo, workspace, gateway, canais, Skills e integridade em um único fluxo.

## Guias relacionados

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/pt-BR/start/wizard" icon="rocket">
    Passo a passo do fluxo interativo da CLI.
  </Card>
  <Card title="Onboarding overview" href="/pt-BR/start/onboarding-overview" icon="map">
    Como a integração inicial do OpenClaw se conecta.
  </Card>
  <Card title="CLI setup reference" href="/pt-BR/start/wizard-cli-reference" icon="book">
    Saídas, componentes internos e comportamento por etapa.
  </Card>
  <Card title="CLI automation" href="/pt-BR/start/wizard-cli-automation" icon="terminal">
    Flags não interativas e configurações automatizadas por script.
  </Card>
  <Card title="macOS app onboarding" href="/pt-BR/start/onboarding" icon="apple">
    Fluxo de integração inicial para o app de barra de menus do macOS.
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

`--flow import` usa provedores de migração de propriedade de plugins, como Hermes. Ele é executado apenas em uma configuração nova do OpenClaw; se houver configuração, credenciais, sessões ou arquivos de memória/identidade do workspace existentes, redefina ou escolha uma configuração nova antes de importar.

`--modern` inicia a prévia de integração inicial conversacional do Crestodian. Sem
`--modern`, `openclaw onboard` mantém o fluxo clássico de integração inicial.

Em uma instalação nova em que o arquivo de configuração ativo está ausente ou não tem configurações
criadas (vazio ou somente com metadados), `openclaw` puro também inicia o fluxo clássico de
integração inicial. Depois que um arquivo de configuração tiver configurações criadas, `openclaw`
puro abre o Crestodian.

`ws://` em texto simples é aceito para loopback, literais de IP privado, `.local` e
URLs de gateway Tailnet `*.ts.net`. Para outros nomes trusted private-DNS, defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de integração inicial.

## Localidade

A integração inicial interativa usa a localidade do assistente da CLI para textos fixos de configuração. A ordem
de resolução é:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Fallback em inglês

As localidades compatíveis do assistente são `en`, `zh-CN` e `zh-TW`. Os valores de localidade podem usar
sublinhado ou formas com sufixo POSIX, como `zh_CN.UTF-8`. Nomes de produto, nomes de comando,
chaves de configuração, URLs, IDs de provedor, IDs de modelo e rótulos de plugin/canal
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

`--custom-api-key` é opcional no modo não interativo. Se omitida, a integração inicial verifica `CUSTOM_API_KEY`.
O OpenClaw marca IDs comuns de modelos de visão como compatíveis com imagem automaticamente. Passe `--custom-image-input` para IDs de visão personalizados desconhecidos, ou `--custom-text-input` para forçar metadados somente de texto.
Use `--custom-compatibility openai-responses` para endpoints compatíveis com OpenAI que aceitam `/v1/responses`, mas não `/v1/chat/completions`.

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

`--custom-base-url` usa `http://127.0.0.1:11434` por padrão. `--custom-model-id` é opcional; se omitido, a integração inicial usa os padrões sugeridos pelo Ollama. IDs de modelos em nuvem como `kimi-k2.5:cloud` também funcionam aqui.

Armazene chaves de provedor como referências em vez de texto simples:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, a integração inicial grava referências baseadas em variáveis de ambiente em vez de valores de chave em texto simples.
Para provedores baseados em perfil de autenticação, isso grava entradas `keyRef`; para provedores personalizados, isso grava `models.providers.<id>.apiKey` como uma referência de ambiente (por exemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo `ref` não interativo:

- Defina a variável de ambiente do provedor no ambiente do processo de integração inicial (por exemplo, `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo, `--openai-api-key`) a menos que essa variável de ambiente também esteja definida.
- Se uma flag de chave inline for passada sem a variável de ambiente exigida, a integração inicial falhará rapidamente com orientação.

Opções de token do Gateway no modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como uma SecretRef de ambiente.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- `--gateway-token-ref-env` exige uma variável de ambiente não vazia no ambiente do processo de integração inicial.
- Com `--install-daemon`, quando a autenticação por token exige um token, tokens de gateway gerenciados por SecretRef são validados, mas não persistidos como texto simples resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo de token exigir um token e a SecretRef de token configurada não puder ser resolvida, a integração inicial falhará fechada com orientação de correção.
- Com `--install-daemon`, se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a integração inicial bloqueará a instalação até que o modo seja definido explicitamente.
- A integração inicial local grava `gateway.mode="local"` na configuração. Se um arquivo de configuração posterior não tiver `gateway.mode`, trate isso como dano de configuração ou edição manual incompleta, não como um atalho válido de modo local.
- A integração inicial local instala plugins baixáveis selecionados quando o caminho de configuração escolhido exige isso.
- A integração inicial remota grava apenas informações de conexão para o Gateway remoto e não instala pacotes de plugins locais.
- `--allow-unconfigured` é uma saída de emergência separada para o runtime do gateway. Ela não significa que a integração inicial pode omitir `gateway.mode`.

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

- A menos que você passe `--skip-health`, a integração inicial aguarda um gateway local acessível antes de sair com sucesso.
- `--install-daemon` inicia primeiro o caminho de instalação do gateway gerenciado. Sem ela, você já precisa ter um gateway local em execução, por exemplo `openclaw gateway run`.
- Se você quiser apenas gravações de configuração/workspace/bootstrap em automação, use `--skip-health`.
- Se você gerencia os arquivos de workspace por conta própria, passe `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` e pular a criação de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- No Windows nativo, `--install-daemon` tenta primeiro Tarefas Agendadas e recorre a um item de login na pasta Inicializar por usuário se a criação da tarefa for negada.

Comportamento da integração inicial interativa com modo de referência:

- Escolha **Usar referência de segredo** quando solicitado.
- Em seguida, escolha uma das opções:
  - Variável de ambiente
  - Provedor de segredo configurado (`file` ou `exec`)
- A integração inicial executa uma validação rápida de preflight antes de salvar a referência.
  - Se a validação falhar, a integração inicial mostra o erro e permite tentar novamente.

### Escolhas de endpoint Z.AI não interativas

<Note>
`--auth-choice zai-api-key` detecta automaticamente o melhor endpoint e modelo Z.AI para
sua chave. Endpoints Coding Plan preferem `zai/glm-5.2`; endpoints de API geral usam
`zai/glm-5.1`. Para forçar um endpoint Coding Plan, escolha `zai-coding-global` ou
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

Exemplo não interativo do Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Flags não interativas adicionais

Autenticação de modelo baseada em token (não interativa; usada com `--auth-choice token`):

- `--token-provider <id>` — ID do provedor de token. Identifica qual provedor emite o token.
- `--token <token>` — Valor do token para autenticação de modelo.
- `--token-profile-id <id>` — ID do perfil de autenticação. O armazenamento genérico de token usa `<provider>:manual` por padrão; fluxos de configuração de propriedade do provedor podem usar seu próprio padrão, como `anthropic:default`.
- `--token-expires-in <duration>` — Duração opcional de expiração do token (por exemplo, `365d`, `12h`).

Cloudflare AI Gateway (não interativo):

- `--cloudflare-ai-gateway-account-id <id>` — ID da conta Cloudflare para roteamento por meio do Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID do Cloudflare AI Gateway.

Controle de instalação do daemon:

- `--no-install-daemon` — Pula explicitamente a instalação do serviço de gateway.
- `--skip-daemon` — Alias de `--no-install-daemon`.

Controle de configuração da UI e de hooks:

- `--skip-ui` — Pula prompts de Control UI / TUI durante a integração inicial.
- `--skip-hooks` — Pula prompts de configuração de webhook / hook durante a integração inicial.

Supressão de saída:

- `--suppress-gateway-token-output` — Suprime a saída do Gateway/UI que contém token (dicas de token, URL de login automático com token incorporado e inicialização automática da Control UI). Útil em ambientes de terminal compartilhado e CI.

## Observações de fluxo

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: prompts mínimos, gera automaticamente um token de gateway.
    - `manual`: prompts completos para porta, bind e autenticação (alias de `advanced`).
    - `import`: executa um provedor de migração detectado, pré-visualiza o plano e depois aplica após confirmação.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Quando uma escolha de autenticação implica um provedor preferencial, a integração inicial pré-filtra os seletores de modelo padrão e allowlist para esse provedor. Para Volcengine e BytePlus, isso também corresponde às variantes de coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se o filtro de provedor preferencial ainda não retornar nenhum modelo carregado, a integração inicial recorre ao catálogo sem filtro em vez de deixar o seletor vazio.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Alguns provedores de web-search acionam prompts de acompanhamento específicos do provedor:

    - **Grok** pode oferecer configuração opcional de `x_search` com o mesmo perfil OAuth ou chave de API da xAI e uma escolha de modelo `x_search`.
    - **Kimi** pode perguntar pela região da API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e pelo modelo padrão de web-search do Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - Comportamento de escopo de DM da integração inicial local: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals).
    - Primeiro chat mais rápido: `openclaw dashboard` (Control UI, sem configuração de canal).
    - Provedor personalizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic, incluindo provedores hospedados não listados. Use Unknown para detectar automaticamente.
    - Se o estado do Hermes for detectado, a integração inicial oferecerá um fluxo de migração. Use [Migrar](/pt-BR/cli/migrate) para planos de dry-run, modo de substituição, relatórios e mapeamentos exatos.

  </Accordion>
</AccordionGroup>

## Comandos comuns de acompanhamento

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Use `openclaw setup` como o mesmo ponto de entrada de integração inicial guiada. Use `openclaw setup --baseline` quando você precisar apenas da configuração/workspace de baseline, `openclaw configure` depois para alterações direcionadas e `openclaw channels add` para configuração somente de canal.

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` para scripts.
</Note>
