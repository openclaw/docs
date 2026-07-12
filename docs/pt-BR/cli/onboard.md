---
read_when:
    - Você quer configurar a inferência e depois concluir a configuração com o Crestodian
summary: Referência da CLI para `openclaw onboard` (integração inicial interativa)
title: Integração inicial
x-i18n:
    generated_at: "2026-07-12T15:05:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Configuração guiada que estabelece primeiro a inferência: detecta o acesso existente à IA,
exige uma conclusão em tempo real, persiste somente a rota funcional e então inicia o
Crestodian para configurar o restante. `openclaw setup` é o mesmo ponto de entrada;
`openclaw setup --baseline` grava apenas a configuração/o espaço de trabalho de referência.

<CardGroup cols={2}>
  <Card title="Central de integração da CLI" href="/pt-BR/start/wizard" icon="rocket">
    Passo a passo do fluxo interativo da CLI.
  </Card>
  <Card title="Visão geral da integração" href="/pt-BR/start/onboarding-overview" icon="map">
    Como as partes da integração do OpenClaw funcionam em conjunto.
  </Card>
  <Card title="Referência da configuração pela CLI" href="/pt-BR/start/wizard-cli-reference" icon="book">
    Saídas, funcionamento interno e comportamento de cada etapa.
  </Card>
  <Card title="Automação da CLI" href="/pt-BR/start/wizard-cli-automation" icon="terminal">
    Flags não interativas e configurações por script.
  </Card>
  <Card title="Integração do aplicativo para macOS" href="/pt-BR/start/onboarding" icon="apple">
    Fluxo de integração do aplicativo da barra de menus do macOS.
  </Card>
</CardGroup>

## Exemplos

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: abre o assistente completo, etapa por etapa. Não pode ser combinado com
  `--non-interactive`; omita `--classic` para uma configuração automatizada.
- `--flow quickstart`: abre o assistente clássico com o mínimo de solicitações e
  gera automaticamente um token do Gateway.
- `--flow manual` (alias `advanced`): abre o assistente clássico com todas as solicitações
  de porta, associação e autenticação.
- `--flow import`: executa um provedor de migração detectado (por exemplo, Hermes via `--import-from hermes`), mostra uma prévia do plano e o aplica após a confirmação. A importação só é executada em uma configuração nova do OpenClaw — primeiro redefina a configuração, as credenciais, as sessões e o estado do espaço de trabalho, caso existam. Use [`openclaw migrate`](/pt-BR/cli/migrate) para planos de simulação, modo de substituição, relatórios e mapeamentos exatos.
- `--modern` é um alias de compatibilidade para o assistente de configuração
  conversacional Crestodian. Ele usa a mesma verificação de inferência em tempo real que `openclaw crestodian` e
  aceita somente `--workspace`, `--accept-risk`,
  `--non-interactive` e `--json`. Outras flags de configuração são rejeitadas em vez de
  serem ignoradas silenciosamente.

## Fluxo guiado

Executar apenas `openclaw onboard` inicia o fluxo guiado. Ele exibe o aviso de segurança,
detecta o acesso à IA já disponível por meio de modelos configurados, variáveis de ambiente
de chaves de API e CLIs locais compatíveis e, em seguida, testa o candidato recomendado
com uma conclusão real. Se esse candidato falhar, a integração mostra
o motivo e tenta automaticamente o próximo candidato utilizável.

Se a detecção automática se esgotar, escolha outro candidato detectado ou insira
uma chave de API do provedor em uma solicitação mascarada. Uma chave manual é testada pelo mesmo
caminho de conclusão em tempo real. A integração guiada
não oferece o Crestodian nem uma saída para ignorar a IA antes que um candidato seja aprovado. O OpenClaw
persiste somente a rota de modelo verificada e sua credencial depois que o teste
é bem-sucedido; um candidato com falha não substitui o modelo configurado nem salva a
credencial usada na tentativa. A configuração do espaço de trabalho e do Gateway permanece inalterada até
que o Crestodian seja iniciado.

No modo guiado, `--workspace <dir>` fornece ao Crestodian o espaço de trabalho proposto
e o contexto de inferência isolado. Ele não é persistido até que você aprove a
proposta de configuração do Crestodian. A integração clássica e a não interativa persistem seus
espaços de trabalho por meio de seus fluxos normais de configuração.

Após a aprovação da inferência, a integração guiada inicia imediatamente o Crestodian com
o modelo verificado. O Crestodian pode então configurar o espaço de trabalho, o Gateway,
os canais, os agentes, os plugins e outros recursos opcionais. Dentro do Crestodian, use
`open channel wizard for <channel>` para transferir a coleta das credenciais do canal para um
assistente mascarado no terminal. Para alterar o provedor do modelo ou sua autenticação,
saia do Crestodian e execute `openclaw onboard`; o Crestodian não abre os fluxos
guiados ou clássicos de provedores.

Em uma instalação configurada, executar `openclaw onboard` novamente verifica primeiro o
modelo padrão atual, de modo que o mesmo fluxo funcione como uma etapa de verificação e reparo.
Se essa verificação falhar, o modelo configurado nunca será substituído automaticamente —
a integração será interrompida e perguntará como continuar. A verificação é executada fora do seu
espaço de trabalho, portanto, um modelo fornecido por um plugin do espaço de trabalho pode falhar aqui e ainda
funcionar no agente.
Use `openclaw onboard --classic` para autenticação específica do provedor, canais, Skills,
configuração remota do Gateway, importações ou controles completos do Gateway. Para configuração
e reparo conversacionais não relacionados à inferência, execute `openclaw crestodian`; `openclaw onboard
--modern` é um alias de compatibilidade que passa pela mesma verificação de inferência. O assistente clássico
pode opcionalmente verificar o modelo padrão com uma conclusão em tempo real, mas
o Crestodian não será iniciado até que sua própria verificação de inferência em tempo real seja aprovada.

Em um terminal interativo, executar apenas `openclaw` (sem subcomando) encaminha com base no estado
da configuração:

- Se o arquivo de configuração ativo estiver ausente ou não tiver configurações definidas (vazio ou
  contendo somente metadados), a integração guiada será iniciada.
- Se o arquivo de configuração existir, mas falhar na validação, o caminho da integração
  clássica será iniciado com orientações do `openclaw doctor`. O Crestodian precisa de uma
  inferência funcional e não é usado para reparar esse estado anterior à inferência.
- Se o arquivo de configuração for válido, a TUI normal do agente será aberta. Um Gateway
  configurado e acessível, com um agente e um modelo, levará diretamente a essa interface sem
  integração ou Crestodian. Em uma instalação configurada, acesse o Crestodian com
  `/crestodian` dentro da TUI ou `openclaw crestodian`.

`ws://` em texto simples é aceito para URLs de Gateway de loopback, literais de IP privado, `.local` e Tailnet `*.ts.net`. Para outros nomes DNS privados confiáveis, defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no ambiente do processo de integração.

## Redefinição

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` apaga o estado antes de executar a configuração. `--reset-scope` controla a abrangência: `config` (somente configuração), `config+creds+sessions` (padrão quando `--reset` é passado sem um escopo) ou `full` (também redefine o espaço de trabalho). A redefinição do espaço de trabalho ocorre somente com `--reset-scope full`.

## Localidade

A integração interativa usa a localidade do assistente da CLI para os textos fixos de configuração. Ordem de resolução:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Inglês como alternativa

As localidades compatíveis do assistente são `en`, `zh-CN` e `zh-TW`. Os valores de localidade podem usar formatos com sublinhado ou sufixos POSIX, como `zh_CN.UTF-8`. Nomes de produtos, nomes de comandos, chaves de configuração, URLs, IDs de provedores, IDs de modelos e rótulos de plugins/canais permanecem literais.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Configuração não interativa

`--non-interactive` exige `--accept-risk` (reconhece que os agentes são poderosos e que o acesso completo ao sistema é arriscado). O padrão de `--mode` é `local`.

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

`--custom-api-key` é opcional; se omitido, a integração verifica `CUSTOM_API_KEY` no ambiente. O OpenClaw marca automaticamente IDs comuns de modelos de visão (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral e semelhantes) como compatíveis com imagens. Passe `--custom-image-input` para IDs personalizados desconhecidos de modelos de visão ou `--custom-text-input` para forçar metadados somente de texto. Use `--custom-compatibility openai-responses` para endpoints compatíveis com OpenAI que oferecem suporte a `/v1/responses`, mas não a `/v1/chat/completions`; os valores válidos são `openai` (padrão), `openai-responses` e `anthropic`.

O LM Studio também tem uma flag de chave específica do provedor:

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

O padrão de `--custom-base-url` é `http://127.0.0.1:11434`. `--custom-model-id` é opcional; se omitido, a integração usa os padrões sugeridos pelo Ollama. IDs de modelos em nuvem, como `kimi-k2.5:cloud`, também funcionam aqui.

Armazene as chaves do provedor como referências, em vez de texto simples:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Com `--secret-input-mode ref`, a integração grava referências baseadas no ambiente, em vez de valores de chave em texto simples: para provedores baseados em perfis de autenticação, isso grava `keyRef: { source: "env", provider: "default", id: <envVar> }`; para provedores personalizados, grava `models.providers.<id>.apiKey` da mesma maneira (por exemplo, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Contrato: defina a variável de ambiente do provedor no ambiente do processo de integração (por exemplo, `OPENAI_API_KEY`) e não passe também uma flag de chave embutida, a menos que essa variável de ambiente esteja definida — o uso de um valor de flag sem a variável de ambiente correspondente falha imediatamente com orientações.

### Autenticação do Gateway (não interativa)

- `--gateway-auth token --gateway-token <token>` armazena um token em texto simples. `token` é o modo de autenticação padrão.
- `--gateway-auth token --gateway-token-ref-env <name>` armazena `gateway.auth.token` como uma SecretRef de ambiente. Exige uma variável de ambiente não vazia com esse nome no ambiente do processo de integração.
- `--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.
- Com `--install-daemon`: um `gateway.auth.token` gerenciado por SecretRef é validado, mas não é persistido como texto simples resolvido nos metadados do ambiente do serviço supervisor; se a referência não for resolvida, a instalação falha de forma restritiva com orientações de correção. Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, a instalação será bloqueada até que o modo seja definido explicitamente.
- A integração local grava `gateway.mode="local"` na configuração. Um arquivo de configuração posterior sem `gateway.mode` indica danos à configuração ou uma edição manual incompleta, e não um atalho válido para o modo local.
- A integração local instala os plugins disponíveis para download exigidos pelo caminho de configuração escolhido (por exemplo, um plugin de runtime do Codex ou Copilot para essas opções de autenticação). A integração remota grava somente as informações de conexão do Gateway remoto — ela nunca instala pacotes de plugins locais.
- `--allow-unconfigured` é uma saída de emergência separada de `openclaw gateway run`; ela não permite que a integração ignore `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Integridade do Gateway local

- A menos que você passe `--skip-health`, a integração aguarda um Gateway local acessível antes de encerrar com sucesso.
- `--install-daemon` inicia primeiro o caminho de instalação do Gateway gerenciado. Sem essa flag, um Gateway local já deve estar em execução (por exemplo, `openclaw gateway run`).
- `--skip-health` ignora a espera se você quiser somente as gravações de configuração/espaço de trabalho/bootstrap na automação.
- `--skip-bootstrap` define `agents.defaults.skipBootstrap: true` e não cria `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` nem `BOOTSTRAP.md`.
- No Windows nativo, `--install-daemon` tenta primeiro as Tarefas Agendadas e recorre a um item de login por usuário na pasta Inicializar se a criação da tarefa for negada.

### Modo de referência interativo

- Escolha **Usar referência de segredo** quando solicitado e, em seguida, **Variável de ambiente** ou um provedor de segredos configurado (`file` ou `exec`).
- A integração executa uma validação preliminar rápida antes de salvar a referência e permite que você tente novamente em caso de falha.

### Opções de endpoint da Z.AI

<Note>
`--auth-choice zai-api-key` detecta automaticamente o melhor endpoint e modelo da Z.AI para sua chave: endpoints do Coding Plan priorizam `zai/glm-5.2` (com fallback para `glm-5.1` se indisponível); endpoints da API geral usam `zai/glm-5.1` por padrão. Para forçar um endpoint do Coding Plan, selecione diretamente `zai-coding-global` ou `zai-coding-cn`.
</Note>

```bash
# Seleção de endpoint sem prompts
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Outras opções de endpoint da Z.AI: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Flags adicionais para o modo não interativo

Autenticação de modelo baseada em token (usada com `--auth-choice token`):

| Flag                            | Descrição                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | ID do provedor de token que emite o token                                                                                           |
| `--token <token>`               | Valor do token para autenticação do modelo                                                                                          |
| `--token-profile-id <id>`       | ID do perfil de autenticação (padrão: `<provider>:manual`; alguns fluxos pertencentes ao provedor usam seu próprio padrão, como `anthropic:default`) |
| `--token-expires-in <duration>` | Duração opcional até a expiração do token (por exemplo, `365d`, `12h`)                                                              |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Controle da instalação do daemon: `--no-install-daemon` / `--skip-daemon` (aliases; ignoram a instalação do serviço do Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (padrão: `npm`), `--skip-skills`.

Configuração da interface e de hooks: `--skip-ui` (ignora os prompts da Control UI/TUI), `--skip-hooks` (ignora a configuração de Webhook/hooks), `--skip-channels`, `--skip-search`.

Saída: `--suppress-gateway-token-output` suprime a saída do Gateway/UI que contém tokens (dicas de token, URL de login automático com token incorporado e inicialização automática da Control UI) — útil em terminais compartilhados e na CI.

<Note>
`--json` não implica o modo não interativo no onboarding guiado ou clássico.
Com `--modern`, o JSON apresenta uma visão geral única do Crestodian e encerra após esse
único resultado. Use `--non-interactive` para outros scripts.
</Note>

## Pré-filtragem de provedores

Quando uma opção de autenticação implica um provedor preferencial, o onboarding pré-filtra os seletores de modelo padrão e de lista de permissões para os modelos desse provedor. O filtro também corresponde a outros provedores pertencentes ao mesmo Plugin, o que abrange variantes de planos de programação, como `volcengine`/`volcengine-plan` e `byteplus`/`byteplus-plan`. Se o filtro de provedor preferencial não encontrar nenhum modelo carregado, o onboarding usa o catálogo sem filtro como fallback, em vez de deixar o seletor vazio.

## Prompts complementares da pesquisa na web

Alguns provedores de pesquisa na web acionam prompts complementares específicos do provedor durante o onboarding:

- **Grok** pode oferecer a configuração opcional de `x_search` com a mesma autenticação da xAI e uma opção de modelo para `x_search`.
- **Kimi** pode solicitar a região da API Moonshot (`api.moonshot.ai` ou `api.moonshot.cn`) e o modelo padrão de pesquisa na web do Kimi.

## Outros comportamentos

- Comportamento do escopo de mensagens diretas no onboarding local: [referência de configuração da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals).
- Primeiro chat da forma mais rápida: `openclaw dashboard` (Control UI, sem configuração de canal).
- Provedor personalizado: conecte qualquer endpoint compatível com OpenAI ou Anthropic, inclusive provedores hospedados que não estejam listados. Use a compatibilidade **Desconhecida** para fazer a detecção automática por meio de uma sondagem em tempo real.
- Se o estado do Hermes for detectado, o onboarding oferecerá um fluxo de migração (consulte `--flow import` acima).

## Comandos complementares comuns

Use `openclaw configure` posteriormente para alterações específicas que não envolvam inferência e `openclaw
channels add` para configurar apenas canais. Para alterações no provedor de modelos ou na rota de autenticação,
execute `openclaw onboard`.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
