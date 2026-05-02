---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de Plugin
    - Trabalhando com pacotes de Plugin compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T05:58:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9378ef4a6aef26949148702f2f6d8537811869511e8830ae5c3d560ff06d98b
    source_path: tools/plugin.md
    workflow: 16
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
harnesses de agente, ferramentas, skills, fala, transcrição em tempo real, voz
em tempo real, compreensão de mídia, geração de imagens, geração de vídeo, busca
na web, pesquisa na web e mais. Alguns plugins são **core** (enviados com o OpenClaw), outros
são **externos**. A maioria dos plugins externos é publicada e descoberta por meio do
[ClawHub](/pt-BR/tools/clawhub). O npm continua com suporte para instalações diretas e para um
conjunto temporário de pacotes de plugins pertencentes ao OpenClaw enquanto essa migração é concluída.

## Início rápido

<Steps>
  <Step title="See what is loaded">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Install a plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    Em seguida, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>

  <Step title="Verify the plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Use `--runtime` quando precisar comprovar ferramentas registradas, serviços, métodos de gateway,
    hooks ou comandos CLI pertencentes ao plugin. O `inspect` simples é uma verificação fria
    de manifesto/registro e evita intencionalmente importar o runtime do plugin.

  </Step>
</Steps>

Se preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

O caminho de instalação usa o mesmo resolvedor que a CLI: caminho/arquivo local, `clawhub:<pkg>` explícito,
`npm:<pkg>` explícito, `git:<repo>` explícito ou especificação simples de pacote
(ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de modo fechado e aponta para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho estreito de reinstalação de
plugin empacotado para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.
Durante a inicialização do Gateway, a configuração inválida de um plugin é isolada nesse plugin:
a inicialização registra o problema em `plugins.entries.<id>.config`, ignora esse plugin durante
o carregamento e mantém outros plugins e canais online. Execute `openclaw doctor --fix`
para colocar em quarentena a configuração ruim do plugin desabilitando essa entrada de plugin e removendo
seu payload de configuração inválido; o backup normal da configuração mantém os valores anteriores.
Quando uma configuração de canal referencia um plugin que não pode mais ser descoberto, mas o
mesmo id de plugin obsoleto permanece na configuração de plugins ou nos registros de instalação, a inicialização do Gateway
registra avisos e ignora esse canal em vez de bloquear todos os outros canais.
Execute `openclaw doctor --fix` para remover as entradas obsoletas de canal/plugin; chaves de
canal desconhecidas sem evidência de plugin obsoleto ainda falham na validação para que erros de digitação continuem
visíveis.
Se `plugins.enabled: false` estiver definido, referências obsoletas a plugins serão tratadas como inertes:
a inicialização do Gateway ignora o trabalho de descoberta/carregamento de plugins e `openclaw doctor` preserva
a configuração de plugins desabilitada em vez de removê-la automaticamente. Reabilite os plugins antes de
executar a limpeza do doctor se quiser remover ids de plugins obsoletos.

A instalação de dependências de plugins acontece somente durante fluxos explícitos de instalação/atualização ou
reparo pelo doctor. A inicialização do Gateway, o recarregamento de configuração e a inspeção de runtime não
executam gerenciadores de pacotes nem reparam árvores de dependências. Plugins locais já devem
ter suas dependências instaladas, enquanto plugins npm, git e ClawHub são
instalados sob as raízes de plugins gerenciadas pelo OpenClaw. Dependências npm podem ser içadas
dentro da raiz npm gerenciada pelo OpenClaw; a instalação/atualização verifica essa raiz gerenciada antes
da confiança, e a desinstalação remove pacotes gerenciados por npm por meio do npm. Plugins externos
e caminhos de carregamento personalizados ainda devem ser instalados com `openclaw plugins install`.
Veja [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution) para o
ciclo de vida no momento da instalação.

Checkouts de código-fonte são workspaces pnpm. Se você clonar o OpenClaw para mexer em plugins
empacotados, execute `pnpm install`; o OpenClaw então carrega plugins empacotados de
`extensions/<id>` para que edições e dependências locais do pacote sejam usadas diretamente.
Instalações simples na raiz npm são para o OpenClaw empacotado, não para desenvolvimento
em checkout de código-fonte.

## Tipos de plugins

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                      | Exemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa em processo    | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Veja [Bundles de Plugins](/pt-BR/plugins/bundles) para detalhes de bundles.

Se você está escrevendo um plugin nativo, comece por [Como criar Plugins](/pt-BR/plugins/building-plugins)
e pela [Visão geral do SDK de Plugins](/pt-BR/plugins/sdk-overview).

## Pontos de entrada de pacote

Pacotes npm de plugins nativos devem declarar `openclaw.extensions` em `package.json`.
Cada entrada deve permanecer dentro do diretório do pacote e resolver para um arquivo de
runtime legível, ou para um arquivo-fonte TypeScript com um par JavaScript compilado inferido,
como `src/index.ts` para `dist/index.js`.

Use `openclaw.runtimeExtensions` quando arquivos de runtime publicados não estiverem nos
mesmos caminhos que as entradas de origem. Quando presente, `runtimeExtensions` deve conter
exatamente uma entrada para cada entrada de `extensions`. Listas incompatíveis fazem a instalação e
a descoberta de plugins falharem em vez de fazer fallback silencioso para caminhos de origem. Se você também
publicar `openclaw.setupEntry`, use `openclaw.runtimeSetupEntry` para seu par JavaScript
compilado; esse arquivo é obrigatório quando declarado.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugins oficiais

### Pacotes npm pertencentes ao OpenClaw durante a migração

ClawHub é o caminho principal de distribuição para a maioria dos plugins. Versões empacotadas atuais
do OpenClaw já incluem muitos plugins oficiais, então eles não precisam de
instalações npm separadas em configurações normais. Até que todos os plugins pertencentes ao OpenClaw tenham
migrado para o ClawHub, o OpenClaw ainda distribui alguns pacotes de plugins `@openclaw/*` no
npm para instalações antigas/personalizadas e fluxos diretos com npm.

Se o npm relatar um pacote de plugin `@openclaw/*` como obsoleto, essa versão de pacote
vem de uma linha mais antiga de pacotes externos. Use o plugin empacotado do
OpenClaw atual ou um checkout local até que um pacote npm mais novo seja publicado.

| Plugin          | Pacote                     | Documentação                               |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/pt-BR/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/pt-BR/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/pt-BR/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/pt-BR/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/pt-BR/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/pt-BR/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/pt-BR/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/pt-BR/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/pt-BR/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/pt-BR/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/pt-BR/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/pt-BR/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/pt-BR/plugins/zalouser)         |

### Core (enviado com o OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (enabled by default)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — pesquisa de memória empacotada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo baseada em LanceDB com recuperação/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)

    Veja [Memory LanceDB](/pt-BR/plugins/memory-lancedb) para configuração de embeddings compatíveis com OpenAI,
    exemplos do Ollama, limites de recuperação e solução de problemas.

  </Accordion>

  <Accordion title="Speech providers (enabled by default)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Other">
    - `browser` — plugin de navegador empacotado para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço padrão de controle de navegador (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — ponte VS Code Copilot Proxy (desabilitada por padrão)

  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Veja [Plugins da comunidade](/pt-BR/plugins/community).

## Configuração

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo            | Descrição                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Alternância principal (padrão: `true`)                    |
| `allow`          | Lista de permissões de plugins (opcional)                 |
| `deny`           | Lista de bloqueio de plugins (opcional; negar prevalece)  |
| `load.paths`     | Arquivos/diretórios extras de plugins                     |
| `slots`          | Seletores de slot exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por plugin                    |

`plugins.allow` é exclusivo. Quando não está vazio, somente plugins listados podem carregar
ou expor ferramentas, mesmo que `tools.allow` contenha `"*"` ou um nome específico de
ferramenta pertencente a um plugin. Se uma lista de permissões de ferramentas referencia ferramentas de plugins, adicione os ids dos plugins proprietários
a `plugins.allow` ou remova `plugins.allow`; `openclaw doctor` avisa sobre esse
formato.

Mudanças de configuração **exigem reinicialização do gateway**. Se o Gateway estiver em execução com observação de configuração
+ reinicialização em processo habilitada (o caminho padrão de `openclaw gateway`), essa
reinicialização geralmente é executada automaticamente instantes depois que a gravação da configuração ocorre.
Não há caminho de hot-reload com suporte para código de runtime de plugins nativos ou hooks de ciclo de vida;
reinicie o processo do Gateway que está atendendo ao canal ativo antes de
esperar que código `register(api)` atualizado, hooks `api.on(...)`, ferramentas, serviços ou
hooks de provedor/runtime sejam executados.

`openclaw plugins list` é um snapshot local do registro/configuração de plugins. Um
plugin `enabled` ali significa que o registro persistido e a configuração atual permitem que o
plugin participe. Isso não prova que um processo filho de Gateway remoto já em execução
tenha reiniciado usando o mesmo código do plugin. Em configurações de VPS/contêiner com
processos wrapper, envie reinicializações para o processo `openclaw gateway run` real,
ou use `openclaw gateway restart` contra o Gateway em execução.

<Accordion title="Estados de Plugin: desativado vs ausente vs inválido">
  - **Desativado**: o plugin existe, mas as regras de habilitação o desativaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao esquema declarado. A inicialização do Gateway ignora apenas esse plugin; `openclaw doctor --fix` pode colocar a entrada inválida em quarentena desabilitando-a e removendo seu payload de configuração.

</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (o primeiro encontrado vence):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório. Caminhos que apontam
    de volta para os diretórios de plugins incluídos empacotados do próprio OpenClaw são ignorados;
    execute `openclaw doctor --fix` para remover esses aliases obsoletos.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluídos">
    Distribuídos com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

Instalações empacotadas e imagens Docker normalmente resolvem plugins incluídos a partir da
árvore compilada `dist/extensions`. Se um diretório-fonte de plugin incluído for
montado via bind sobre o caminho-fonte empacotado correspondente, por exemplo
`/app/extensions/synology-chat`, o OpenClaw trata esse diretório-fonte montado
como uma sobreposição de fonte incluída e o descobre antes do bundle empacotado
`/app/dist/extensions/synology-chat`. Isso mantém os loops de contêiner de mantenedores
funcionando sem voltar todos os plugins incluídos para fonte TypeScript.
Defina `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forçar bundles dist empacotados
mesmo quando montagens de sobreposição de fonte estiverem presentes.

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os plugins e ignora o trabalho de descoberta/carregamento de plugins
- `plugins.deny` sempre vence `allow`
- `plugins.entries.\<id\>.enabled: false` desabilita esse plugin
- Plugins originados do workspace são **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins incluídos seguem o conjunto integrado habilitado por padrão, salvo quando sobrescrito
- Slots exclusivos podem forçar a habilitação do plugin selecionado para esse slot
- Alguns plugins incluídos opt-in são habilitados automaticamente quando a configuração nomeia uma
  superfície pertencente ao plugin, como uma referência de modelo de provedor, configuração de canal ou runtime de harness
- Configuração obsoleta de plugin é preservada enquanto `plugins.enabled: false` estiver ativo;
  reabilite plugins antes de executar a limpeza do doctor se quiser que ids obsoletos sejam removidos
- Rotas Codex da família OpenAI mantêm limites de plugin separados:
  `openai-codex/*` pertence ao plugin OpenAI, enquanto o plugin incluído de servidor de app Codex
  é selecionado por `agentRuntime.id: "codex"` ou por referências de modelo legadas
  `codex/*`

## Solução de problemas de hooks de runtime

Se um plugin aparece em `plugins list`, mas os efeitos colaterais ou hooks de
`register(api)` não executam no tráfego de chat ao vivo, verifique primeiro:

- Execute `openclaw gateway status --deep --require-rpc` e confirme se a URL,
  o perfil, o caminho de configuração e o processo do Gateway ativo são os que você está editando.
- Reinicie o Gateway ao vivo após alterações de instalação/configuração/código do plugin. Em contêineres
  com wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou sinalize o processo filho
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --runtime --json` para confirmar registros de hooks e
  diagnósticos. Hooks de conversa não incluídos, como `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end`, precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele executa antes da
  resolução de modelo em turnos de agente; `llm_output` só executa depois que uma tentativa de modelo
  produz saída do assistente.
- Para comprovar o modelo efetivo da sessão, use `openclaw sessions` ou as
  superfícies de sessão/status do Gateway e, ao depurar payloads de provedor, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

### Configuração lenta de ferramentas de plugin

Se turnos de agente parecem travar enquanto preparam ferramentas, habilite logging em trace e
verifique linhas de temporização de fábricas de ferramentas de plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] factory timings ...
```

O resumo lista o tempo total de fábrica e as fábricas de ferramentas de plugin mais lentas,
incluindo id do plugin, nomes de ferramentas declarados, formato do resultado e se a ferramenta é
opcional. Linhas lentas são promovidas a avisos quando uma única fábrica leva
pelo menos 1s ou a preparação total de fábricas de ferramentas de plugin leva pelo menos 5s.

Se um plugin domina a temporização, inspecione seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Em seguida, atualize, reinstale ou desabilite esse plugin. Autores de plugins devem mover
o carregamento caro de dependências para trás do caminho de execução da ferramenta, em vez de fazê-lo
dentro da fábrica de ferramentas.

### Propriedade duplicada de canal ou ferramenta

Sintomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Isso significa que mais de um plugin habilitado está tentando possuir o mesmo canal,
fluxo de configuração ou nome de ferramenta. A causa mais comum é um plugin de canal externo
instalado ao lado de um plugin incluído que agora fornece o mesmo id de canal.

Etapas de depuração:

- Execute `openclaw plugins list --enabled --verbose` para ver todos os plugins habilitados
  e suas origens.
- Execute `openclaw plugins inspect <id> --runtime --json` para cada plugin suspeito e
  compare `channels`, `channelConfigs`, `tools` e diagnósticos.
- Execute `openclaw plugins registry --refresh` após instalar ou remover
  pacotes de plugin para que os metadados persistidos reflitam a instalação atual.
- Reinicie o Gateway após alterações de instalação, registro ou configuração.

Opções de correção:

- Se um plugin substitui intencionalmente outro para o mesmo id de canal, o
  plugin preferido deve declarar `channelConfigs.<channel-id>.preferOver` com
  o id do plugin de menor prioridade. Veja [/plugins/manifest#replacing-another-channel-plugin](/pt-BR/plugins/manifest#replacing-another-channel-plugin).
- Se a duplicata for acidental, desabilite um dos lados com
  `plugins.entries.<plugin-id>.enabled: false` ou remova a instalação de plugin
  obsoleta.
- Se você habilitou explicitamente ambos os plugins, o OpenClaw mantém essa solicitação e
  relata o conflito. Escolha um proprietário para o canal ou renomeie ferramentas pertencentes ao plugin
  para que a superfície de runtime seja inequívoca.

## Slots de plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Slot            | O que controla        | Padrão              |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memória ativa | `memory-core`       |
| `contextEngine` | Motor de contexto ativo | `legacy` (integrado) |

## Referência da CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install (ClawHub first, then npm)
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins incluídos são distribuídos com o OpenClaw. Muitos são habilitados por padrão (por exemplo
provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador incluído).
Outros plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado ou hook pack existente no mesmo local. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de plugins npm
rastreados. Ele não é compatível com `--link`, que reutiliza o caminho-fonte em vez
de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa allowlist antes de habilitá-lo. Se o mesmo id de plugin
estiver presente em `plugins.deny`, a instalação remove essa entrada deny obsoleta para que a
instalação explícita possa ser carregada imediatamente após a reinicialização.

O OpenClaw mantém um registro local persistido de plugins como o modelo de leitura fria para
inventário de plugins, propriedade de contribuições e planejamento de inicialização. Fluxos de instalação, atualização,
desinstalação, habilitação e desabilitação atualizam esse registro após alterar o estado do plugin.
O mesmo arquivo `plugins/installs.json` mantém metadados duráveis de instalação em
`installRecords` no nível superior e metadados reconstruíveis de manifesto em `plugins`. Se
o registro estiver ausente, obsoleto ou inválido, `openclaw plugins registry
--refresh` reconstrói sua visão de manifesto a partir de registros de instalação, política de configuração e
metadados de manifesto/pacote sem carregar módulos de runtime de plugin.
`openclaw plugins update <id-or-npm-spec>` aplica-se a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro do plugin rastreado e registra a nova especificação para atualizações futuras.
Passar o nome do pacote sem uma versão move uma instalação fixada exata de volta para
a linha de release padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade do artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou reescrever a configuração.

`--pin` é exclusivo do npm. Ele não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do verificador de código perigoso integrado. Ele permite que instalações
e atualizações de plugins continuem após achados `critical` integrados, mas ainda
não ignora bloqueios de política `before_install` de plugins nem bloqueios por falha de verificação.
As verificações de instalação ignoram arquivos e diretórios comuns de teste, como `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*`, para evitar bloquear mocks de teste empacotados;
pontos de entrada de runtime declarados do plugin ainda são verificados mesmo que usem um desses
nomes.

Essa flag da CLI se aplica apenas aos fluxos de instalação/atualização de plugins. Instalações de
dependências de Skills apoiadas pelo Gateway usam, em vez disso, a substituição de solicitação
`dangerouslyForceUnsafeInstall` correspondente, enquanto `openclaw skills install` continua sendo o fluxo
separado de download/instalação de Skills do ClawHub.

Se um plugin que você publicou no ClawHub for ocultado ou bloqueado por uma verificação, abra o
painel do ClawHub ou execute `clawhub package rescan <name>` para pedir que o ClawHub o verifique
novamente. `--dangerously-force-unsafe-install` afeta apenas instalações na sua própria
máquina; ele não pede ao ClawHub para verificar o plugin novamente nem torna pública uma versão
bloqueada.

Bundles compatíveis participam do mesmo fluxo de listar/inspecionar/habilitar/desabilitar
plugins. O suporte atual de runtime inclui Skills de bundle, Skills de comando do Claude,
padrões `settings.json` do Claude, padrões `lspServers` declarados no manifesto e em `.lsp.json` do Claude,
Skills de comando do Cursor e diretórios de hooks compatíveis do Codex.

`openclaw plugins inspect <id>` também relata capacidades de bundle detectadas, além de entradas de servidor MCP e LSP
compatíveis ou incompatíveis para plugins baseados em bundle.

Origens de marketplace podem ser um nome de marketplace conhecido do Claude de
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou
caminho `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub
ou uma URL git. Para marketplaces remotos, entradas de plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas origens com caminhos relativos.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de Plugin

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins mais antigos
ainda podem usar `activate(api)` como um alias legado, mas novos plugins devem
usar `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

O OpenClaw carrega o objeto de entrada e chama `register(api)` durante a
ativação do plugin. O carregador ainda recorre a `activate(api)` para plugins mais antigos,
mas plugins incluídos e novos plugins externos devem tratar `register` como o
contrato público.

`api.registrationMode` informa a um plugin por que sua entrada está sendo carregada:

| Modo            | Significado                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação em runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ativos.                              |
| `discovery`     | Descoberta de capacidades somente leitura. Registre provedores e metadados; código de entrada de plugin confiável pode ser carregado, mas ignore efeitos colaterais ativos. |
| `setup-only`    | Carregamento de metadados de configuração de canal por meio de uma entrada de configuração leve.                                                                |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                                         |
| `cli-metadata`  | Apenas coleta de metadados de comandos da CLI.                                                                                            |

Entradas de plugin que abrem sockets, bancos de dados, workers em segundo plano ou clientes
de longa duração devem proteger esses efeitos colaterais com `api.registrationMode === "full"`.
Carregamentos de descoberta são armazenados em cache separadamente dos carregamentos de ativação e não substituem
o registro do Gateway em execução. A descoberta não ativa, mas não é livre de importação:
o OpenClaw pode avaliar a entrada de plugin confiável ou o módulo de plugin de canal para construir
o snapshot. Mantenha os níveis superiores dos módulos leves e sem efeitos colaterais, e mova
clientes de rede, subprocessos, listeners, leituras de credenciais e inicialização de serviços
para trás de caminhos de runtime completo.

Métodos comuns de registro:

| Método                                  | O que ele registra           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)        |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Ferramenta de agente                  |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida             |
| `registerSpeechProvider`                | Texto para fala / STT        |
| `registerRealtimeTranscriptionProvider` | STT em streaming               |
| `registerRealtimeVoiceProvider`         | Voz em tempo real duplex       |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio        |
| `registerImageGenerationProvider`       | Geração de imagens            |
| `registerMusicGenerationProvider`       | Geração de música            |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de busca/coleta na web |
| `registerWebSearchProvider`             | Pesquisa na web                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos da CLI                |
| `registerContextEngine`                 | Motor de contexto              |
| `registerService`                       | Serviço em segundo plano          |

Comportamento de proteção de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` é terminal; manipuladores de prioridade mais baixa são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; manipuladores de prioridade mais baixa são ignorados.
- `before_install`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; manipuladores de prioridade mais baixa são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não limpa um cancelamento anterior.

O servidor de app nativo do Codex executa a ponte de eventos de ferramentas nativas do Codex de volta para essa
superfície de hooks. Plugins podem bloquear ferramentas nativas do Codex por meio de `before_tool_call`,
observar resultados por meio de `after_tool_call` e participar de aprovações de
`PermissionRequest` do Codex. A ponte ainda não reescreve argumentos de ferramentas nativas do Codex.
O limite exato de suporte do runtime do Codex está no
[contrato de suporte do harness v1 do Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

Para o comportamento completo de hooks tipados, consulte a [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Bundles de plugins](/pt-BR/plugins/bundles) — compatibilidade de bundles do Codex/Claude/Cursor
- [Manifesto de plugin](/pt-BR/plugins/manifest) — esquema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um plugin
- [Internos de plugins](/pt-BR/plugins/architecture) — modelo de capacidade e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
