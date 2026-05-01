---
read_when:
    - Instalando ou configurando plugins
    - Entendendo a descoberta de plugins e as regras de carregamento
    - Trabalhando com pacotes de Plugin compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie Plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-01T06:00:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f876df0c2ed3ff356ada9462b56f2b5a65a662b64b328ecc97d8b463036934
    source_path: tools/plugin.md
    workflow: 16
---

Plugins estendem o OpenClaw com novas capacidades: canais, provedores de modelo,
arneses de agente, ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
entendimento de mídia, geração de imagens, geração de vídeo, busca na web, pesquisa na web
e muito mais. Alguns plugins são **core** (enviados com o OpenClaw), outros
são **externos**. A maioria dos plugins externos é publicada e descoberta pelo
[ClawHub](/pt-BR/tools/clawhub). O npm continua com suporte para instalações diretas e para um
conjunto temporário de pacotes de Plugin mantidos pelo OpenClaw enquanto essa migração é concluída.

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

Se preferir controle nativo do chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, 
`clawhub:<pkg>` explícito, `npm:<pkg>` explícito ou especificação de pacote simples (ClawHub primeiro, depois
fallback para npm).

Se a configuração for inválida, a instalação normalmente falha fechada e aponta para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de reinstalação de plugin empacotado
para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.
Durante a inicialização do Gateway, a configuração inválida de um plugin é isolada a esse plugin:
a inicialização registra o problema de `plugins.entries.<id>.config`, ignora esse plugin durante o
carregamento e mantém outros plugins e canais online. Execute `openclaw doctor --fix`
para colocar em quarentena a configuração incorreta do plugin desabilitando essa entrada de plugin e removendo
seu payload de configuração inválido; o backup normal da configuração mantém os valores anteriores.
Quando uma configuração de canal referencia um plugin que não é mais detectável, mas o
mesmo id de plugin obsoleto permanece na configuração do plugin ou nos registros de instalação, a inicialização do Gateway
registra avisos e ignora esse canal em vez de bloquear todos os outros canais.
Execute `openclaw doctor --fix` para remover as entradas obsoletas de canal/plugin; chaves de
canal desconhecidas sem evidência de plugin obsoleto ainda falham na validação para que erros de digitação continuem
visíveis.
Se `plugins.enabled: false` estiver definido, referências obsoletas de plugin serão tratadas como inertes:
a inicialização do Gateway ignora o trabalho de descoberta/carregamento de plugin, e `openclaw doctor` preserva
a configuração de plugin desabilitada em vez de removê-la automaticamente. Reabilite os plugins antes de
executar a limpeza do doctor se quiser que ids de plugin obsoletos sejam removidos.

Instalações empacotadas do OpenClaw não instalam avidamente toda a árvore de dependências
de runtime de cada plugin empacotado. Quando um plugin empacotado mantido pelo OpenClaw está ativo a partir da
configuração de plugin, configuração legada de canal ou manifesto habilitado por padrão, a inicialização
repara apenas as dependências de runtime declaradas desse plugin antes de importá-lo.
O estado persistido de autenticação de canal sozinho não ativa um canal empacotado para
reparo de dependências de runtime na inicialização do Gateway.
A desabilitação explícita ainda prevalece: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impedem o reparo automático das dependências de runtime empacotadas para esse plugin/canal.
Um `plugins.allow` não vazio também limita o reparo de dependências de runtime empacotadas habilitadas por padrão; a habilitação explícita de canal empacotado (`channels.<id>.enabled: true`) ainda pode
reparar as dependências do plugin desse canal.
Plugins externos e caminhos de carregamento personalizados ainda devem ser instalados por meio de
`openclaw plugins install`.

## Tipos de Plugin

O OpenClaw reconhece dois formatos de Plugin:

| Formato     | Como funciona                                                       | Exemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo       | Plugins oficiais, pacotes npm da comunidade               |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Bundles de Plugin](/pt-BR/plugins/bundles) para detalhes de bundle.

Se você está escrevendo um plugin nativo, comece com [Criando Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview).

## Pontos de entrada do pacote

Pacotes npm de plugin nativo devem declarar `openclaw.extensions` em `package.json`.
Cada entrada deve permanecer dentro do diretório do pacote e resolver para um arquivo de
runtime legível, ou para um arquivo-fonte TypeScript com um par JavaScript compilado inferido,
como `src/index.ts` para `dist/index.js`.

Use `openclaw.runtimeExtensions` quando os arquivos de runtime publicados não estiverem nos
mesmos caminhos que as entradas de origem. Quando presente, `runtimeExtensions` deve conter
exatamente uma entrada para cada entrada de `extensions`. Listas incompatíveis fazem a instalação e
a descoberta de plugins falharem, em vez de voltar silenciosamente aos caminhos de origem.

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

### Pacotes npm mantidos pelo OpenClaw durante a migração

ClawHub é o caminho principal de distribuição para a maioria dos plugins. As versões empacotadas atuais do
OpenClaw já incluem muitos plugins oficiais, então eles não precisam de
instalações npm separadas em configurações normais. Até que todos os plugins mantidos pelo OpenClaw tenham
migrado para o ClawHub, o OpenClaw ainda envia alguns pacotes de Plugin `@openclaw/*` no
npm para instalações antigas/personalizadas e fluxos diretos de npm.

Se o npm reportar um pacote de Plugin `@openclaw/*` como obsoleto, essa versão do pacote
é de uma linha de pacotes externos mais antiga. Use o plugin empacotado do
OpenClaw atual ou um checkout local até que um pacote npm mais novo seja publicado.

| Plugin          | Pacote                    | Docs                                       |
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
    - `memory-lancedb` — memória de longo prazo instalada sob demanda com rechamada/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)

    Consulte [Memory LanceDB](/pt-BR/plugins/memory-lancedb) para configuração de
    embeddings compatíveis com OpenAI, exemplos do Ollama, limites de rechamada e solução de problemas.

  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de navegador empacotado para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço padrão de controle de navegador (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — ponte do VS Code Copilot Proxy (desabilitada por padrão)

  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Consulte [Plugins da Comunidade](/pt-BR/plugins/community).

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

| Campo            | Descrição                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Alternância mestre (padrão: `true`)                           |
| `allow`          | Lista de permissões de Plugin (opcional)                               |
| `deny`           | Lista de bloqueio de Plugin (opcional; deny prevalece)                     |
| `load.paths`     | Arquivos/diretórios extras de plugin                            |
| `slots`          | Seletores de slot exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por plugin                               |

`plugins.allow` é exclusivo. Quando não está vazio, somente os plugins listados podem carregar
ou expor ferramentas, mesmo que `tools.allow` contenha `"*"` ou um nome específico de ferramenta
pertencente ao plugin. Se uma lista de permissões de ferramentas referencia ferramentas de plugin, adicione os ids dos plugins proprietários
a `plugins.allow` ou remova `plugins.allow`; `openclaw doctor` avisa sobre esse
formato.

Alterações de configuração **exigem uma reinicialização do gateway**. Se o Gateway estiver em execução com observação de configuração
+ reinicialização em processo habilitadas (o caminho padrão de `openclaw gateway`), essa
reinicialização geralmente é executada automaticamente um momento depois que a gravação da configuração é concluída.
Não há caminho de hot-reload suportado para código de runtime de plugin nativo ou hooks de ciclo de vida; reinicie o processo do Gateway que está servindo o canal ativo antes de
esperar que código `register(api)` atualizado, hooks `api.on(...)`, ferramentas, serviços ou
hooks de provider/runtime sejam executados.

`openclaw plugins list` é um snapshot local do registro/configuração de plugins. Um plugin
`enabled` ali significa que o registro persistido e a configuração atual permitem que o
plugin participe. Isso não prova que um processo filho de Gateway remoto já em execução
tenha sido reiniciado com o mesmo código de plugin. Em configurações de VPS/contêiner com
processos wrapper, envie reinicializações ao processo real `openclaw gateway run`,
ou use `openclaw gateway restart` contra o Gateway em execução.

<Accordion title="Estados de plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o plugin existe, mas as regras de habilitação o desligaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao esquema declarado. A inicialização do Gateway ignora apenas esse plugin; `openclaw doctor --fix` pode colocar a entrada inválida em quarentena desabilitando-a e removendo seu payload de configuração.

</Accordion>

## Descoberta e precedência

O OpenClaw verifica plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório. Caminhos que apontam
    de volta para os próprios diretórios de Plugin empacotados do OpenClaw são ignorados;
    execute `openclaw doctor --fix` para remover esses aliases obsoletos.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluídos">
    Enviados com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

Instalações empacotadas e imagens Docker normalmente resolvem Plugins incluídos a partir da
árvore compilada `dist/extensions`. Se um diretório de origem de Plugin incluído for
montado por bind sobre o caminho de origem empacotado correspondente, por exemplo
`/app/extensions/synology-chat`, o OpenClaw trata esse diretório de origem montado
como uma sobreposição de origem incluída e o descobre antes do bundle empacotado
`/app/dist/extensions/synology-chat`. Isso mantém os ciclos de contêiner de mantenedores
funcionando sem alternar todos os Plugins incluídos de volta para a origem TypeScript.
Defina `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forçar os bundles dist empacotados
mesmo quando montagens de sobreposição de origem estiverem presentes.

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os Plugins e ignora o trabalho de descoberta/carregamento de Plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse Plugin
- Plugins originados do workspace são **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins incluídos seguem o conjunto interno habilitado por padrão, salvo substituição
- Slots exclusivos podem forçar a habilitação do Plugin selecionado para esse slot
- Alguns Plugins incluídos opt-in são habilitados automaticamente quando a configuração nomeia uma
  superfície pertencente ao Plugin, como uma referência de modelo de provedor, configuração de canal ou runtime
  de harness
- A configuração obsoleta de Plugin é preservada enquanto `plugins.enabled: false` está ativo;
  reabilite Plugins antes de executar a limpeza do doctor se quiser remover ids obsoletos
- Rotas Codex da família OpenAI mantêm limites de Plugin separados:
  `openai-codex/*` pertence ao Plugin OpenAI, enquanto o Plugin de servidor de app Codex
  incluído é selecionado por `agentRuntime.id: "codex"` ou referências de modelo legadas
  `codex/*`

## Solução de problemas de hooks de runtime

Se um Plugin aparecer em `plugins list`, mas os efeitos colaterais ou hooks de `register(api)`
não forem executados no tráfego de chat ao vivo, verifique primeiro:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a URL,
  o perfil, o caminho de configuração e o processo ativos do Gateway são aqueles que você está editando.
- Reinicie o Gateway ao vivo após mudanças de instalação/configuração/código do Plugin. Em contêineres
  wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou sinalize o processo filho
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --json` para confirmar registros de hook e
  diagnósticos. Hooks de conversa não incluídos, como `llm_input`,
  `llm_output`, `before_agent_finalize` e `agent_end`, precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da resolução
  de modelo para turnos de agente; `llm_output` só é executado depois que uma tentativa de modelo
  produz saída de assistente.
- Para comprovar o modelo de sessão efetivo, use `openclaw sessions` ou as
  superfícies de sessão/status do Gateway e, ao depurar payloads de provedor, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

### Propriedade duplicada de canal ou ferramenta

Sintomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Isso significa que mais de um Plugin habilitado está tentando possuir o mesmo canal,
fluxo de configuração ou nome de ferramenta. A causa mais comum é um Plugin de canal externo
instalado ao lado de um Plugin incluído que agora fornece o mesmo id de canal.

Etapas de depuração:

- Execute `openclaw plugins list --enabled --verbose` para ver todos os Plugins habilitados
  e suas origens.
- Execute `openclaw plugins inspect <id> --json` para cada Plugin suspeito e
  compare `channels`, `channelConfigs`, `tools` e diagnósticos.
- Execute `openclaw plugins registry --refresh` depois de instalar ou remover
  pacotes de Plugin para que os metadados persistidos reflitam a instalação atual.
- Reinicie o Gateway após mudanças de instalação, registro ou configuração.

Opções de correção:

- Se um Plugin substitui intencionalmente outro para o mesmo id de canal, o
  Plugin preferido deve declarar `channelConfigs.<channel-id>.preferOver` com
  o id do Plugin de prioridade mais baixa. Veja [/plugins/manifest#replacing-another-channel-plugin](/pt-BR/plugins/manifest#replacing-another-channel-plugin).
- Se a duplicidade for acidental, desabilite um lado com
  `plugins.entries.<plugin-id>.enabled: false` ou remova a instalação obsoleta do Plugin.
- Se você habilitou explicitamente ambos os Plugins, o OpenClaw mantém essa solicitação e
  relata o conflito. Escolha um proprietário para o canal ou renomeie as ferramentas pertencentes ao Plugin
  para que a superfície de runtime seja inequívoca.

## Slots de Plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desabilitar
      contextEngine: "legacy", // ou um id de Plugin
    },
  },
}
```

| Slot            | O que controla        | Padrão              |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memória ativo | `memory-core`       |
| `contextEngine` | Motor de contexto ativo | `legacy` (interno) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas Plugins habilitados
openclaw plugins list --verbose            # linhas de detalhes por Plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspeção
openclaw plugins doctor                    # diagnósticos
openclaw plugins registry                  # inspecionar estado do registro persistido
openclaw plugins registry --refresh        # reconstruir registro persistido
openclaw doctor --fix                      # reparar estado do registro de Plugins

openclaw plugins install <package>         # instalar (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instalar apenas do ClawHub
openclaw plugins install npm:<pkg>         # instalar apenas do npm
openclaw plugins install <spec> --force    # sobrescrever instalação existente
openclaw plugins install <path>            # instalar de caminho local
openclaw plugins install -l <path>         # vincular (sem copiar) para dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar spec npm resolvida exata
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualizar um Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualizar todos
openclaw plugins uninstall <id>          # remover configuração e registros de índice de Plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins incluídos são enviados com o OpenClaw. Muitos são habilitados por padrão (por exemplo
provedores de modelo incluídos, provedores de fala incluídos e o Plugin de navegador incluído).
Outros Plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um Plugin instalado existente ou hook pack no local. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de Plugins npm
rastreados. Isso não é compatível com `--link`, que reutiliza o caminho de origem em vez
de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do Plugin instalado a essa allowlist antes de habilitá-lo. Se o mesmo id de Plugin
estiver presente em `plugins.deny`, a instalação remove essa entrada deny obsoleta para que a
instalação explícita seja carregável imediatamente após a reinicialização.

O OpenClaw mantém um registro local persistido de Plugins como o modelo de leitura fria para
inventário de Plugins, propriedade de contribuições e planejamento de inicialização. Fluxos de instalação, atualização,
desinstalação, habilitação e desabilitação atualizam esse registro depois de alterar o estado do Plugin.
O mesmo arquivo `plugins/installs.json` mantém metadados de instalação duráveis em
`installRecords` de nível superior e metadados de manifesto reconstruíveis em `plugins`. Se
o registro estiver ausente, obsoleto ou inválido, `openclaw plugins registry
--refresh` reconstrói sua visão de manifesto a partir de registros de instalação, política de configuração e
metadados de manifesto/pacote sem carregar módulos de runtime de Plugin.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma spec de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro do Plugin rastreado e registra a nova spec para atualizações futuras.
Passar o nome do pacote sem uma versão move uma instalação fixada exata de volta para
a linha de lançamento padrão do registro. Se o Plugin npm instalado já corresponder
à versão resolvida e à identidade do artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou reescrever a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados de origem do marketplace em vez de uma spec npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner de código perigoso interno. Ele permite que instalações de Plugin
e atualizações de Plugin continuem após findings `critical` internos, mas ainda
não ignora bloqueios de política `before_install` de Plugin nem bloqueio por falha de varredura.
Varreduras de instalação ignoram arquivos e diretórios de teste comuns, como `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*`, para evitar bloquear mocks de teste empacotados;
entrypoints de runtime declarados do Plugin ainda são verificados mesmo que usem um desses
nomes.

Essa flag da CLI se aplica apenas a fluxos de instalação/atualização de Plugin. Instalações de
dependências de Skills com suporte do Gateway usam a substituição de solicitação
`dangerouslyForceUnsafeInstall` correspondente, enquanto `openclaw skills install` continua sendo o fluxo
separado de download/instalação de Skills do ClawHub.

Se um Plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma varredura, abra o
painel do ClawHub ou execute `clawhub package rescan <name>` para pedir ao ClawHub que o verifique
novamente. `--dangerously-force-unsafe-install` afeta apenas instalações na sua própria
máquina; ele não pede ao ClawHub para verificar novamente o Plugin nem torna pública uma versão
bloqueada.

Bundles compatíveis participam do mesmo fluxo de listar/inspecionar/habilitar/desabilitar
Plugins. O suporte de runtime atual inclui Skills de bundle, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude e
`lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hook
Codex compatíveis.

`openclaw plugins inspect <id>` também relata capacidades de bundle detectadas, além de
entradas de servidor MCP e LSP compatíveis ou incompatíveis para Plugins baseados em bundle.

Origens de marketplace podem ser um nome de marketplace conhecido do Claude a partir de
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou
caminho `marketplace.json`, um atalho do GitHub como `owner/repo`, uma URL de repositório
GitHub ou uma URL git. Para marketplaces remotos, as entradas de Plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas origens de caminho relativo.

Veja a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de Plugin

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins
mais antigos ainda podem usar `activate(api)` como alias legado, mas novos Plugins devem
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
ativação do Plugin. O carregador ainda recorre a `activate(api)` para Plugins
mais antigos, mas Plugins incluídos e novos Plugins externos devem tratar
`register` como o contrato público.

`api.registrationMode` informa a um Plugin por que sua entrada está sendo carregada:

| Modo            | Significado                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação em runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ativos.                              |
| `discovery`     | Descoberta de capacidades somente leitura. Registre provedores e metadados; o código de entrada de Plugin confiável pode carregar, mas pule efeitos colaterais ativos. |
| `setup-only`    | Carregamento de metadados de configuração de canal por meio de uma entrada de configuração leve.                                                                |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                                         |
| `cli-metadata`  | Apenas coleta de metadados de comandos da CLI.                                                                                            |

Entradas de Plugin que abrem sockets, bancos de dados, workers em segundo plano ou
clientes de longa duração devem proteger esses efeitos colaterais com
`api.registrationMode === "full"`. Carregamentos de descoberta são armazenados em
cache separadamente dos carregamentos de ativação e não substituem o registro do
Gateway em execução. A descoberta é não ativadora, não livre de importação:
o OpenClaw pode avaliar a entrada de Plugin confiável ou o módulo de Plugin de
canal para criar o snapshot. Mantenha os níveis superiores de módulo leves e sem
efeitos colaterais, e mova clientes de rede, subprocessos, listeners, leituras de
credenciais e inicialização de serviços para caminhos de runtime completo.

Métodos comuns de registro:

| Método                                  | O que ele registra           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)        |
| `registerChannel`                       | Canal de chat                |
| `registerTool`                          | Ferramenta de agente                  |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida             |
| `registerSpeechProvider`                | Texto para fala / STT        |
| `registerRealtimeTranscriptionProvider` | STT por streaming               |
| `registerRealtimeVoiceProvider`         | Voz em tempo real duplex       |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio        |
| `registerImageGenerationProvider`       | Geração de imagens            |
| `registerMusicGenerationProvider`       | Geração de música            |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de busca/coleta na Web |
| `registerWebSearchProvider`             | Pesquisa na Web                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos da CLI                |
| `registerContextEngine`                 | Mecanismo de contexto              |
| `registerService`                       | Serviço em segundo plano          |

Comportamento de proteção de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Execuções nativas do servidor de app Codex conectam eventos de ferramentas
nativas do Codex de volta a esta superfície de hooks. Plugins podem bloquear
ferramentas nativas do Codex por meio de `before_tool_call`, observar resultados
por meio de `after_tool_call` e participar das aprovações de `PermissionRequest`
do Codex. A ponte ainda não reescreve argumentos de ferramentas nativas do Codex.
O limite exato de suporte ao runtime do Codex está no
[contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

Para o comportamento completo de hooks tipados, consulte a [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Criação de Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio Plugin
- [Pacotes de Plugins](/pt-BR/plugins/bundles) — compatibilidade de pacotes Codex/Claude/Cursor
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — esquema do manifesto
- [Registro de ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um Plugin
- [Detalhes internos de Plugin](/pt-BR/plugins/architecture) — modelo de capacidades e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
