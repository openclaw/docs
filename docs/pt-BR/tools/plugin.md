---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de Plugin
    - Como trabalhar com pacotes de Plugin compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie os plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-30T10:12:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a12d158053c13b47a56d8d6b382818962e9b5109fdf8ededd3ecf92b83089e6
    source_path: tools/plugin.md
    workflow: 16
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
harnesses de agentes, ferramentas, skills, fala, transcrição em tempo real, voz
em tempo real, compreensão de mídia, geração de imagens, geração de vídeo, busca
na web, pesquisa na web e mais. Alguns plugins são **core** (enviados com o OpenClaw), outros
são **externos**. A maioria dos plugins externos é publicada e descoberta por meio do
[ClawHub](/pt-BR/tools/clawhub). O npm continua sendo compatível para instalações diretas e para um
conjunto temporário de pacotes de plugins pertencentes ao OpenClaw enquanto essa migração é concluída.

## Início rápido

<Steps>
  <Step title="Veja o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instale um plugin">
    ```bash
    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Em seguida, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se você preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

O caminho de instalação usa o mesmo resolvedor que a CLI: caminho/arquivo local, `clawhub:<pkg>`
explícito, `npm:<pkg>` explícito ou especificação de pacote simples (ClawHub primeiro, depois
fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de modo fechado e aponta para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho estreito de reinstalação de
plugin empacotado para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.
Durante a inicialização do Gateway, a configuração inválida de um plugin é isolada a esse plugin:
a inicialização registra o problema em `plugins.entries.<id>.config`, ignora esse plugin durante
o carregamento e mantém outros plugins e canais online. Execute `openclaw doctor --fix`
para colocar a configuração ruim do plugin em quarentena, desabilitando essa entrada de plugin e removendo
sua carga de configuração inválida; o backup normal da configuração mantém os valores anteriores.
Quando uma configuração de canal referencia um plugin que não é mais descobrível, mas o
mesmo id de plugin obsoleto permanece na configuração de plugin ou nos registros de instalação, a inicialização do Gateway
registra avisos e ignora esse canal em vez de bloquear todos os outros canais.
Execute `openclaw doctor --fix` para remover as entradas obsoletas de canal/plugin; chaves de
canal desconhecidas sem evidência de plugin obsoleto ainda falham na validação para que erros de digitação continuem
visíveis.
Se `plugins.enabled: false` estiver definido, referências obsoletas a plugins são tratadas como inertes:
a inicialização do Gateway ignora o trabalho de descoberta/carregamento de plugins e `openclaw doctor` preserva
a configuração de plugin desabilitada em vez de removê-la automaticamente. Reabilite plugins antes de
executar a limpeza do doctor se quiser remover ids de plugins obsoletos.

Instalações empacotadas do OpenClaw não instalam avidamente toda a árvore de dependências de runtime
de cada plugin empacotado. Quando um plugin pertencente ao OpenClaw empacotado está ativo pela
configuração de plugins, configuração legada de canal ou um manifesto habilitado por padrão, a inicialização
repara apenas as dependências de runtime declaradas desse plugin antes de importá-lo.
Somente o estado persistido de autenticação de canal não ativa um canal empacotado para
reparo de dependências de runtime na inicialização do Gateway.
A desabilitação explícita ainda prevalece: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impedem o reparo automático de dependências de runtime empacotadas desse plugin/canal.
Um `plugins.allow` não vazio também limita o reparo de dependências de runtime empacotadas
habilitadas por padrão; a habilitação explícita de canal empacotado (`channels.<id>.enabled: true`) ainda pode
reparar as dependências de plugin desse canal.
Plugins externos e caminhos de carregamento personalizados ainda devem ser instalados por meio de
`openclaw plugins install`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                     | Exemplos                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo   | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Bundles de Plugin](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você está escrevendo um plugin nativo, comece com [Criação de Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Pontos de entrada de pacote

Pacotes npm de plugin nativo devem declarar `openclaw.extensions` em `package.json`.
Cada entrada deve permanecer dentro do diretório do pacote e resolver para um arquivo de
runtime legível, ou para um arquivo-fonte TypeScript com um par JavaScript compilado inferido,
como `src/index.ts` para `dist/index.js`.

Use `openclaw.runtimeExtensions` quando os arquivos de runtime publicados não estiverem nos
mesmos caminhos das entradas de origem. Quando presente, `runtimeExtensions` deve conter
exatamente uma entrada para cada entrada de `extensions`. Listas incompatíveis fazem a instalação e
a descoberta de plugins falharem em vez de recorrer silenciosamente aos caminhos de origem.

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

ClawHub é o principal caminho de distribuição para a maioria dos plugins. As versões empacotadas atuais
do OpenClaw já incluem muitos plugins oficiais, portanto eles não precisam de
instalações npm separadas em configurações normais. Até que todos os plugins pertencentes ao OpenClaw tenham
migrado para o ClawHub, o OpenClaw ainda distribui alguns pacotes de plugin `@openclaw/*` no
npm para instalações mais antigas/personalizadas e fluxos diretos de npm.

Se o npm informar que um pacote de plugin `@openclaw/*` está obsoleto, essa versão do pacote
vem de uma linha antiga de pacotes externos. Use o plugin empacotado do
OpenClaw atual ou um checkout local até que um pacote npm mais novo seja publicado.

| Plugin          | Pacote                     | Docs                                       |
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
  <Accordion title="Provedores de modelo (habilitados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — busca de memória empacotada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo instalada sob demanda com recuperação/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)

    Consulte [Memory LanceDB](/pt-BR/plugins/memory-lancedb) para configuração de embeddings compatíveis com OpenAI,
    exemplos do Ollama, limites de recuperação e solução de problemas.

  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de navegador empacotado para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço padrão de controle de navegador (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — ponte VS Code Copilot Proxy (desabilitada por padrão)

  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Consulte [Plugins da comunidade](/pt-BR/plugins/community).

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
| `deny`           | Lista de bloqueio de plugins (opcional; deny prevalece)   |
| `load.paths`     | Arquivos/diretórios extras de plugin                      |
| `slots`          | Seletores de slot exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por plugin                    |

Alterações de configuração **exigem reinicialização do gateway**. Se o Gateway estiver rodando com observação de configuração
+ reinicialização em processo habilitada (o caminho padrão `openclaw gateway`), essa
reinicialização geralmente é feita automaticamente um momento depois que a gravação da configuração chega.
Não há caminho de hot-reload compatível para código de runtime de plugin nativo ou hooks de ciclo de vida;
reinicie o processo do Gateway que atende o canal ativo antes de
esperar que código `register(api)` atualizado, hooks `api.on(...)`, ferramentas, serviços ou
hooks de provedor/runtime sejam executados.

`openclaw plugins list` é um snapshot local do registro/configuração de plugins. Um plugin
`enabled` ali significa que o registro persistido e a configuração atual permitem que o
plugin participe. Isso não prova que um filho remoto do Gateway já em execução
tenha reiniciado com o mesmo código de plugin. Em configurações VPS/container com
processos wrapper, envie reinicializações para o processo real `openclaw gateway run`,
ou use `openclaw gateway restart` contra o Gateway em execução.

<Accordion title="Estados de plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o plugin existe, mas as regras de habilitação o desativaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao schema declarado. A inicialização do Gateway ignora apenas esse plugin; `openclaw doctor --fix` pode colocar a entrada inválida em quarentena desabilitando-a e removendo sua carga de configuração.

</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (a primeira correspondência prevalece):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório. Caminhos que apontam
    de volta para os diretórios de plugins empacotados do próprio OpenClaw são ignorados;
    execute `openclaw doctor --fix` para remover esses aliases obsoletos.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Bundled plugins">
    Incluídos com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

Instalações empacotadas e imagens Docker normalmente resolvem plugins incluídos a partir da
árvore compilada `dist/extensions`. Se um diretório de código-fonte de plugin incluído for
montado com bind sobre o caminho de código-fonte empacotado correspondente, por exemplo
`/app/extensions/synology-chat`, o OpenClaw trata esse diretório de código-fonte montado
como uma sobreposição de código-fonte incluído e o descobre antes do pacote empacotado
`/app/dist/extensions/synology-chat`. Isso mantém os ciclos de contêiner dos mantenedores
funcionando sem alternar todos os plugins incluídos de volta para código-fonte TypeScript.
Defina `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forçar pacotes dist empacotados
mesmo quando montagens de sobreposição de código-fonte estiverem presentes.

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os plugins e ignora o trabalho de descoberta/carregamento de plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse plugin
- Plugins originados do workspace são **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins incluídos seguem o conjunto interno habilitado por padrão, a menos que seja sobrescrito
- Slots exclusivos podem forçar a habilitação do plugin selecionado para esse slot
- Alguns plugins incluídos opcionais são habilitados automaticamente quando a configuração nomeia uma
  superfície pertencente ao plugin, como uma referência de modelo de provedor, configuração de canal ou runtime
  de harness
- Configuração obsoleta de plugin é preservada enquanto `plugins.enabled: false` está ativo;
  reabilite plugins antes de executar a limpeza do doctor se você quiser remover ids obsoletos
- Rotas Codex da família OpenAI mantêm limites de plugin separados:
  `openai-codex/*` pertence ao plugin OpenAI, enquanto o plugin de servidor de app Codex
  incluído é selecionado por `agentRuntime.id: "codex"` ou referências de modelo legadas
  `codex/*`

## Solução de problemas de hooks de runtime

Se um plugin aparece em `plugins list`, mas efeitos colaterais ou hooks de `register(api)`
não são executados no tráfego de chat ao vivo, verifique primeiro:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a URL, o perfil,
  o caminho de configuração e o processo do Gateway ativo são os que você está editando.
- Reinicie o Gateway ao vivo após alterações de instalação/configuração/código de plugin. Em contêineres
  wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou envie sinal ao processo filho
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --json` para confirmar registros de hooks e
  diagnósticos. Hooks de conversa não incluídos, como `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end`, precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da
  resolução do modelo para turnos de agente; `llm_output` só é executado depois que uma tentativa de modelo
  produz saída do assistente.
- Para comprovar o modelo efetivo da sessão, use `openclaw sessions` ou as superfícies
  de sessão/status do Gateway e, ao depurar payloads de provedor, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

### Propriedade duplicada de canal ou ferramenta

Sintomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Isso significa que mais de um plugin habilitado está tentando ser dono do mesmo canal,
fluxo de configuração ou nome de ferramenta. A causa mais comum é um plugin de canal externo
instalado ao lado de um plugin incluído que agora fornece o mesmo id de canal.

Etapas de depuração:

- Execute `openclaw plugins list --enabled --verbose` para ver todos os plugins habilitados
  e sua origem.
- Execute `openclaw plugins inspect <id> --json` para cada plugin suspeito e
  compare `channels`, `channelConfigs`, `tools` e os diagnósticos.
- Execute `openclaw plugins registry --refresh` após instalar ou remover
  pacotes de plugin para que os metadados persistidos reflitam a instalação atual.
- Reinicie o Gateway após alterações de instalação, registro ou configuração.

Opções de correção:

- Se um plugin substituir intencionalmente outro para o mesmo id de canal, o
  plugin preferido deve declarar `channelConfigs.<channel-id>.preferOver` com
  o id do plugin de prioridade mais baixa. Consulte [/plugins/manifest#replacing-another-channel-plugin](/pt-BR/plugins/manifest#replacing-another-channel-plugin).
- Se a duplicata for acidental, desabilite um lado com
  `plugins.entries.<plugin-id>.enabled: false` ou remova a instalação obsoleta do plugin.
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

| Slot            | O que controla             | Padrão              |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin de memória ativa    | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (interno) |

## Referência da CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins inspect <id>              # deep detail
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

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins incluídos são enviados com o OpenClaw. Muitos são habilitados por padrão (por exemplo,
provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador
incluído). Outros plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado existente ou pacote de hooks no local. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de plugins npm
rastreados. Isso não é compatível com `--link`, que reutiliza o caminho de código-fonte em vez
de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa lista de permissões antes de habilitá-lo. Se o mesmo id de plugin
estiver presente em `plugins.deny`, a instalação remove essa entrada deny obsoleta para que a
instalação explícita possa ser carregada imediatamente após a reinicialização.

O OpenClaw mantém um registro local persistido de plugins como modelo de leitura a frio para
inventário de plugins, propriedade de contribuições e planejamento de inicialização. Fluxos de instalação,
atualização, desinstalação, habilitação e desabilitação atualizam esse registro após alterar o estado
do plugin. O mesmo arquivo `plugins/installs.json` mantém metadados duráveis de instalação em
`installRecords` de nível superior e metadados de manifesto reconstruíveis em `plugins`. Se
o registro estiver ausente, obsoleto ou inválido, `openclaw plugins registry
--refresh` reconstrói sua visão de manifesto a partir de registros de instalação, política de configuração e
metadados de manifesto/pacote sem carregar módulos de runtime de plugin.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro do plugin rastreado e grava a nova especificação para atualizações futuras.
Passar o nome do pacote sem uma versão move uma instalação fixada exata de volta para
a linha de lançamento padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou reescrever a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados de origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner de código perigoso integrado. Ela permite que instalações de plugins
e atualizações de plugins continuem após achados `critical` integrados, mas ainda
não ignora bloqueios de política `before_install` do plugin nem bloqueio por falha de varredura.
Varreduras de instalação ignoram arquivos e diretórios de teste comuns, como `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*`, para evitar bloquear mocks de teste empacotados;
entrypoints de runtime de plugin declarados ainda são varridos mesmo que usem um desses
nomes.

Esta flag de CLI se aplica apenas aos fluxos de instalação/atualização de plugins. Instalações de
dependências de Skills apoiadas pelo Gateway usam a substituição de solicitação
`dangerouslyForceUnsafeInstall` correspondente, enquanto `openclaw skills install` continua sendo o fluxo
separado de download/instalação de Skills do ClawHub.

Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma varredura, abra o
painel do ClawHub ou execute `clawhub package rescan <name>` para pedir ao ClawHub que o verifique
novamente. `--dangerously-force-unsafe-install` afeta apenas instalações na sua própria
máquina; ele não pede ao ClawHub para revarrer o plugin nem torna pública uma versão
bloqueada.

Pacotes compatíveis participam do mesmo fluxo de listar/inspecionar/habilitar/desabilitar
plugins. O suporte de runtime atual inclui Skills de pacote, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude e
`lspServers` declarados por manifesto, command-skills do Cursor e diretórios de hooks
Codex compatíveis.

`openclaw plugins inspect <id>` também relata capacidades de pacote detectadas, além de
entradas de servidor MCP e LSP compatíveis ou não compatíveis para plugins baseados em pacote.

Origens de marketplace podem ser um nome de marketplace conhecido do Claude a partir de
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou caminho de
`marketplace.json`, um atalho do GitHub como `owner/repo`, uma URL de repositório do GitHub
ou uma URL git. Para marketplaces remotos, as entradas de plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas origens de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de plugin

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
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `full`          | Ativação em tempo de execução. Registra ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ativos.            |
| `discovery`     | Descoberta de capacidades somente leitura. Registra provedores e metadados; o código de entrada confiável do Plugin pode ser carregado, mas ignora efeitos colaterais ativos. |
| `setup-only`    | Carregamento de metadados de configuração do canal por meio de uma entrada de configuração leve.                                      |
| `setup-runtime` | Carregamento de configuração do canal que também precisa da entrada de runtime.                                                       |
| `cli-metadata`  | Apenas coleta de metadados de comandos da CLI.                                                                                        |

Entradas de Plugin que abrem soquetes, bancos de dados, workers em segundo
plano ou clientes de longa duração devem proteger esses efeitos colaterais com
`api.registrationMode === "full"`. Carregamentos de descoberta são armazenados
em cache separadamente dos carregamentos de ativação e não substituem o registro
do Gateway em execução. A descoberta é não ativadora, não livre de importação:
o OpenClaw pode avaliar a entrada confiável do Plugin ou o módulo do Plugin de
canal para criar o snapshot. Mantenha os níveis superiores dos módulos leves e
sem efeitos colaterais, e mova clientes de rede, subprocessos, listeners,
leituras de credenciais e inicialização de serviços para trás dos caminhos de
runtime completo.

Métodos comuns de registro:

| Método                                  | O que ele registra                         |
| --------------------------------------- | ------------------------------------------ |
| `registerProvider`                      | Provedor de modelo (LLM)                   |
| `registerChannel`                       | Canal de chat                              |
| `registerTool`                          | Ferramenta de agente                       |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida                     |
| `registerSpeechProvider`                | Conversão de texto em fala / STT           |
| `registerRealtimeTranscriptionProvider` | STT por streaming                          |
| `registerRealtimeVoiceProvider`         | Voz em tempo real duplex                   |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio                    |
| `registerImageGenerationProvider`       | Geração de imagens                         |
| `registerMusicGenerationProvider`       | Geração de música                          |
| `registerVideoGenerationProvider`       | Geração de vídeo                           |
| `registerWebFetchProvider`              | Provedor de busca / extração na Web        |
| `registerWebSearchProvider`             | Pesquisa na Web                            |
| `registerHttpRoute`                     | Endpoint HTTP                              |
| `registerCommand` / `registerCli`       | Comandos da CLI                            |
| `registerContextEngine`                 | Mecanismo de contexto                      |
| `registerService`                       | Serviço em segundo plano                   |

Comportamento de guarda de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Execuções nativas do app-server do Codex fazem a ponte de eventos de ferramentas
nativas do Codex de volta para esta superfície de hooks. Plugins podem bloquear
ferramentas nativas do Codex por meio de `before_tool_call`, observar resultados
por meio de `after_tool_call` e participar das aprovações de `PermissionRequest`
do Codex. A ponte ainda não reescreve argumentos de ferramentas nativas do
Codex. O limite exato de suporte do runtime do Codex está no
[contrato de suporte do harness v1 do Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

Para ver o comportamento completo de hooks tipados, consulte a [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Criação de Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio Plugin
- [Bundles de Plugin](/pt-BR/plugins/bundles) — compatibilidade de bundles do Codex/Claude/Cursor
- [Manifesto do Plugin](/pt-BR/plugins/manifest) — esquema do manifesto
- [Registro de ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um Plugin
- [Componentes internos de Plugin](/pt-BR/plugins/architecture) — modelo de capacidade e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
