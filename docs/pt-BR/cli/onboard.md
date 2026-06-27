---
read_when:
    - Você quer uma configuração guiada para Gateway, workspace, autenticação, canais e Skills
summary: Referência da CLI para `openclaw onboard` (configuração inicial interativa)
title: Integrar
x-i18n:
    generated_at: "2026-06-27T17:20:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Onboarding guiado completo para configuração de Gateway local ou remoto. Use isto quando quiser que o OpenClaw percorra autenticação de modelo, workspace, Gateway, canais, Skills e integridade em um único fluxo.

## Guias relacionados

<CardGroup cols={2}>
  <Card title="Hub de onboarding da CLI" href="/pt-BR/start/wizard" icon="rocket">
    Passo a passo do fluxo interativo da CLI.
  </Card>
  <Card title="Visão geral do onboarding" href="/pt-BR/start/onboarding-overview" icon="map">
    Como o onboarding do OpenClaw se encaixa.
  </Card>
  <Card title="Referência de configuração da CLI" href="/pt-BR/start/wizard-cli-reference" icon="book">
    Saídas, aspectos internos e comportamento por etapa.
  </Card>
  <Card title="Automação da CLI" href="/pt-BR/start/wizard-cli-automation" icon="terminal">
    Flags não interativas e configurações por script.
  </Card>
  <Card title="Onboarding do app para macOS" href="/pt-BR/start/onboarding" icon="apple">
    Fluxo de onboarding para o app de barra de menus do macOS.
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

`--flow import` usa provedores de migração pertencentes a plugins, como Hermes. Ele só roda em uma configuração nova do OpenClaw; se houver config, credenciais, sessões ou arquivos de memória/identidade de workspace existentes, redefina ou escolha uma configuração nova antes de importar.

`--modern` inicia a prévia de onboarding conversacional do Crestodian. Sem
`--modern`, `openclaw onboard` mantém o fluxo de onboarding clássico.

Em uma instalação nova em que o arquivo de config ativo está ausente ou não tem
configurações definidas (vazio ou somente metadados), `openclaw` sem argumentos também inicia o fluxo de
onboarding clássico. Depois que um arquivo de config tiver configurações definidas, `openclaw` sem argumentos
abre o Crestodian.

`ws://` em texto simples é aceito para loopback, literais de IP privado, `.local` e
URLs de Gateway Tailnet `*.ts.net`. Para outros nomes confiáveis de DNS privado, defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de onboarding.

## Localidade

O onboarding interativo usa a localidade do assistente da CLI para textos fixos de configuração. A ordem de
resolução é:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. fallback para inglês

As localidades compatíveis do assistente são `en`, `zh-CN` e `zh-TW`. Valores de localidade podem usar
sublinhado ou formas com sufixo POSIX, como `zh_CN.UTF-8`. Nomes de produtos, nomes de comandos,
chaves de config, URLs, IDs de provedores, IDs de modelos e rótulos de plugins/canais
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

`--custom-api-key` é opcional no modo não interativo. Se omitido, o onboarding verifica `CUSTOM_API_KEY`.
O OpenClaw marca IDs comuns de modelos com visão como compatíveis com imagem automaticamente. Passe `--custom-image-input` para IDs personalizados de visão desconhecidos, ou `--custom-text-input` para forçar metadados somente texto.
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

`--custom-base-url` usa `http://127.0.0.1:11434` por padrão. `--custom-model-id` é opcional; se omitido, o onboarding usa os padrões sugeridos do Ollama. IDs de modelos em nuvem, como `kimi-k2.5:cloud`, também funcionam aqui.

Armazene chaves de provedor como refs em vez de texto simples:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, o onboarding grava refs baseadas em env em vez de valores de chave em texto simples.
Para provedores baseados em auth-profile, isso grava entradas `keyRef`; para provedores personalizados, isso grava `models.providers.<id>.apiKey` como uma ref de env (por exemplo `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrato do modo `ref` não interativo:

- Defina a variável de env do provedor no ambiente do processo de onboarding (por exemplo, `OPENAI_API_KEY`).
- Não passe flags de chave inline (por exemplo, `--openai-api-key`), a menos que essa variável de env também esteja definida.
- Se uma flag de chave inline for passada sem a variável de env obrigatória, o onboarding falha rapidamente com orientação.

Opções de token do Gateway no modo não interativo:

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como um SecretRef de env.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- `--gateway-token-ref-env` exige uma variável de env não vazia no ambiente do processo de onboarding.
- Com `--install-daemon`, quando a autenticação por token exige um token, tokens de Gateway gerenciados por SecretRef são validados, mas não persistidos como texto simples resolvido nos metadados de ambiente do serviço supervisor.
- Com `--install-daemon`, se o modo de token exigir um token e o SecretRef de token configurado não for resolvido, o onboarding falha fechado com orientação de correção.
- Com `--install-daemon`, se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, o onboarding bloqueia a instalação até que o modo seja definido explicitamente.
- O onboarding local grava `gateway.mode="local"` na config. Se um arquivo de config posterior estiver sem `gateway.mode`, trate isso como dano de config ou uma edição manual incompleta, não como um atalho válido de modo local.
- O onboarding local instala plugins selecionados e baixáveis quando o caminho de configuração escolhido exige isso.
- O onboarding remoto grava somente informações de conexão para o Gateway remoto e não instala pacotes de plugins locais.
- `--allow-unconfigured` é uma saída de emergência separada do runtime do Gateway. Ela não significa que o onboarding pode omitir `gateway.mode`.

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

- A menos que você passe `--skip-health`, o onboarding aguarda um Gateway local acessível antes de encerrar com sucesso.
- `--install-daemon` inicia primeiro o caminho de instalação do Gateway gerenciado. Sem ele, você já precisa ter um Gateway local em execução, por exemplo `openclaw gateway run`.
- Se você só quiser gravações de config/workspace/bootstrap em automação, use `--skip-health`.
- Se você gerencia arquivos de workspace por conta própria, passe `--skip-bootstrap` para definir `agents.defaults.skipBootstrap: true` e pular a criação de `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- No Windows nativo, `--install-daemon` tenta primeiro Tarefas Agendadas e faz fallback para um item de login na pasta Inicializar por usuário se a criação da tarefa for negada.

Comportamento do onboarding interativo com modo de referência:

- Escolha **Usar referência de segredo** quando solicitado.
- Em seguida, escolha uma das opções:
  - Variável de ambiente
  - Provedor de segredos configurado (`file` ou `exec`)
- O onboarding executa uma validação rápida de preflight antes de salvar a ref.
  - Se a validação falhar, o onboarding mostra o erro e permite que você tente novamente.

### Escolhas de endpoint Z.AI não interativas

<Note>
`--auth-choice zai-api-key` detecta automaticamente o melhor endpoint e modelo da Z.AI para
sua chave. Endpoints de Coding Plan preferem `zai/glm-5.2`; endpoints de API geral usam
`zai/glm-5.1`. Para forçar um endpoint de Coding Plan, escolha `zai-coding-global` ou
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

## Notas do fluxo

<AccordionGroup>
  <Accordion title="Tipos de fluxo">
    - `quickstart`: prompts mínimos, gera automaticamente um token do Gateway.
    - `manual`: prompts completos para porta, bind e autenticação (alias de `advanced`).
    - `import`: executa um provedor de migração detectado, pré-visualiza o plano e então aplica após confirmação.

  </Accordion>
  <Accordion title="Pré-filtragem de provedor">
    Quando uma escolha de autenticação implica um provedor preferido, o onboarding pré-filtra os seletores de modelo padrão e allowlist para esse provedor. Para Volcengine e BytePlus, isso também corresponde às variantes de coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Se o filtro de provedor preferido ainda não produzir modelos carregados, o onboarding faz fallback para o catálogo sem filtro em vez de deixar o seletor vazio.

  </Accordion>
  <Accordion title="Acompanhamentos de busca na web">
    Alguns provedores de busca na web acionam prompts de acompanhamento específicos do provedor:

    - **Grok** pode oferecer configuração opcional de `x_search` com o mesmo perfil OAuth da xAI ou chave de API e uma escolha de modelo `x_search`.
    - **Kimi** pode perguntar a região da API Moonshot (`api.moonshot.ai` vs `api.moonshot.cn`) e o modelo padrão de busca na web do Kimi.

  </Accordion>
  <Accordion title="Outros comportamentos">
    - Comportamento de escopo de DM do onboarding local: [Referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals).
    - Primeiro chat mais rápido: `openclaw dashboard` (Control UI, sem configuração de canal).
    - Provedor personalizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic, incluindo provedores hospedados não listados. Use Unknown para detectar automaticamente.
    - Se o estado do Hermes for detectado, o onboarding oferece um fluxo de migração. Use [Migrate](/pt-BR/cli/migrate) para planos de dry-run, modo de sobrescrita, relatórios e mapeamentos exatos.

  </Accordion>
</AccordionGroup>

## Comandos comuns de acompanhamento

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Use `openclaw setup` em vez disso quando você só precisar da config/workspace de base. Use `openclaw configure` depois para alterações direcionadas e `openclaw channels add` para configuração somente de canal.

<Note>
`--json` não implica modo não interativo. Use `--non-interactive` para scripts.
</Note>
