---
read_when:
    - Instalando ou configurando plugins
    - Entendendo a descoberta de plugins e as regras de carregamento
    - Trabalhando com pacotes de Plugin compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-12T08:46:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8773fc3feb19c867b1978f21d83f1cad1752d5a2572ad607d481539ad7471df
    source_path: tools/plugin.md
    workflow: 16
---

Plugins ampliam o OpenClaw com novos recursos: canais, provedores de modelo,
harnesses de agentes, ferramentas, Skills, fala, transcrição em tempo real, voz
em tempo real, compreensão de mídia, geração de imagens, geração de vídeos,
busca de conteúdo na web, pesquisa na web e muito mais. Alguns plugins são
**centrais** (incluídos com o OpenClaw), outros são **externos**. A maioria dos
plugins externos é publicada e descoberta por meio do
[ClawHub](/pt-BR/clawhub). O npm continua sendo compatível para instalações diretas e
para um conjunto temporário de pacotes de plugins mantidos pelo OpenClaw enquanto
essa migração é concluída.

## Início rápido

Para exemplos de instalar, listar, desinstalar, atualizar e publicar que podem
ser copiados e colados, consulte
[Gerenciar plugins](/pt-BR/plugins/manage-plugins).

<Steps>
  <Step title="Ver o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar um plugin">
    ```bash
    # Search ClawHub plugins
    openclaw plugins search "calendar"

    # From ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # From npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # From git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # From a local directory or archive
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Em seguida, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>

  <Step title="Gerenciamento nativo do chat">
    Em um Gateway em execução, `/plugins enable` e `/plugins disable`, disponíveis
    apenas para o proprietário, acionam o recarregador de configuração do Gateway.
    O Gateway recarrega as superfícies de runtime do plugin no processo, e novas
    interações do agente reconstroem sua lista de ferramentas a partir do registro
    atualizado. `/plugins install` altera o código-fonte do plugin, portanto o
    Gateway solicita uma reinicialização em vez de fingir que o processo atual
    pode recarregar com segurança módulos já importados.

  </Step>

  <Step title="Verificar o plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Use `--runtime` quando precisar comprovar ferramentas registradas, serviços,
    métodos de Gateway, hooks ou comandos CLI pertencentes ao plugin. `inspect`
    simples é uma verificação fria de manifesto/registro e evita intencionalmente
    importar o runtime do plugin.

  </Step>
</Steps>

Se preferir controle nativo do chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local,
`clawhub:<pkg>` explícito, `npm:<pkg>` explícito, `npm-pack:<path.tgz>`
explícito, `git:<repo>` explícito ou especificação de pacote sem prefixo via
npm.

Se a configuração for inválida, a instalação normalmente falha de forma fechada e
direciona você para `openclaw doctor --fix`. A única exceção de recuperação é um
caminho estreito de reinstalação de plugin incluído para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.
Durante a inicialização do Gateway, configuração de plugin inválida falha de
forma fechada como qualquer outra configuração inválida. Execute
`openclaw doctor --fix` para colocar em quarentena a configuração de plugin
problemática, desabilitando essa entrada de plugin e removendo seu payload de
configuração inválido; o backup normal de configuração mantém os valores
anteriores.
Quando uma configuração de canal referencia um plugin que não é mais descobrível,
mas o mesmo id de plugin obsoleto permanece na configuração do plugin ou nos
registros de instalação, a inicialização do Gateway registra avisos e ignora esse
canal em vez de bloquear todos os outros canais. Execute `openclaw doctor --fix`
para remover as entradas obsoletas de canal/plugin; chaves de canal desconhecidas
sem evidência de plugin obsoleto ainda falham na validação para que erros de
digitação continuem visíveis.
Se `plugins.enabled: false` estiver definido, referências obsoletas de plugin são
tratadas como inertes: a inicialização do Gateway ignora o trabalho de descoberta
/carregamento de plugins e `openclaw doctor` preserva a configuração de plugins
desabilitada em vez de removê-la automaticamente. Reabilite plugins antes de
executar a limpeza do doctor se quiser remover ids de plugins obsoletos.

A instalação de dependências de plugin acontece apenas durante fluxos explícitos
de instalação/atualização ou reparo pelo doctor. Inicialização do Gateway,
recarga de configuração e inspeção de runtime não executam gerenciadores de
pacotes nem reparam árvores de dependências. Plugins locais já devem ter suas
dependências instaladas, enquanto plugins de npm, git e ClawHub são instalados
sob as raízes de plugins gerenciadas pelo OpenClaw. Dependências npm podem ser
elevadas dentro da raiz npm gerenciada pelo OpenClaw; a instalação/atualização
varre essa raiz gerenciada antes da confiança, e a desinstalação remove pacotes
gerenciados por npm por meio do npm. Plugins externos e caminhos de carregamento
personalizados ainda devem ser instalados por meio de `openclaw plugins install`.
Use `openclaw plugins list --json` para ver o `dependencyStatus` estático de cada
plugin visível sem importar código de runtime nem reparar dependências.
Consulte [Resolução de dependências de plugin](/pt-BR/plugins/dependency-resolution)
para o ciclo de vida em tempo de instalação.

### Propriedade de caminho de plugin bloqueado

Se os diagnósticos do plugin disserem
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e a validação da configuração vier em seguida com `plugin present but blocked`, o
OpenClaw encontrou arquivos de plugin pertencentes a um usuário Unix diferente do
processo que os está carregando. Mantenha a configuração do plugin no lugar;
corrija a propriedade no sistema de arquivos ou execute o OpenClaw como o mesmo
usuário que possui o diretório de estado.

Para instalações Docker, a imagem oficial roda como `node` (uid `1000`), então
os diretórios de configuração e workspace do OpenClaw montados por bind no host
normalmente devem pertencer ao uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se você executa intencionalmente o OpenClaw como root, repare a raiz de plugins
gerenciada para propriedade de root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Depois de corrigir a propriedade, execute novamente `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` para que o registro de plugins persistido
corresponda aos arquivos reparados.

Para instalações npm, seletores mutáveis como `latest` ou uma dist-tag são
resolvidos antes da instalação e então fixados na versão exata verificada na raiz
npm gerenciada pelo OpenClaw. Depois que o npm termina, o OpenClaw verifica se a
entrada instalada de `package-lock.json` ainda corresponde à versão resolvida e à
integridade. Se o npm gravar metadados de pacote diferentes, a instalação falha e
o pacote gerenciado é revertido em vez de aceitar um artefato de plugin
diferente.
Raízes npm gerenciadas também herdam os `overrides` npm em nível de pacote do
OpenClaw, portanto pins de segurança que protegem o host empacotado também se
aplicam a dependências externas de plugin elevadas.

Checkouts de origem são workspaces pnpm. Se você clonar o OpenClaw para trabalhar
em plugins incluídos, execute `pnpm install`; então o OpenClaw carrega plugins
incluídos de `extensions/<id>` para que edições e dependências locais do pacote
sejam usadas diretamente. Instalações npm simples na raiz são para OpenClaw
empacotado, não para desenvolvimento em checkout de origem.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                     | Exemplos                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo   | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Bundles de plugin](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você está escrevendo um plugin nativo, comece por [Criando plugins](/pt-BR/plugins/building-plugins)
e pela [Visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview).

## Pontos de entrada de pacote

Pacotes npm de plugin nativo devem declarar `openclaw.extensions` em
`package.json`. Cada entrada deve permanecer dentro do diretório do pacote e
resolver para um arquivo de runtime legível, ou para um arquivo-fonte TypeScript
com um par JavaScript compilado inferido, como `src/index.ts` para
`dist/index.js`.
Instalações empacotadas devem incluir essa saída de runtime JavaScript. O fallback
de fonte TypeScript é para checkouts de origem e caminhos de desenvolvimento
local, não para pacotes npm instalados na raiz de plugins gerenciada pelo
OpenClaw.

Diretórios não rastreados colocados na raiz global de extensões são tratados como
checkouts de origem locais e podem carregar entradas TypeScript diretamente.
Diretórios ainda nomeados por um registro de instalação, incluindo `installPath`
ou `sourcePath`, permanecem gerenciados e mantêm o requisito de saída compilada
mesmo quando a varredura global os vê. Se você converter intencionalmente uma
instalação gerenciada em um checkout local não rastreado, remova primeiro o
registro de instalação obsoleto com desinstalação ou limpeza pelo doctor.

Se um aviso de pacote gerenciado disser que ele `requires compiled runtime output for
TypeScript entry ...`, o pacote foi publicado sem os arquivos JavaScript de que o
OpenClaw precisa em runtime. Isso é um problema de empacotamento do plugin, não
um problema de configuração local. Atualize ou reinstale o plugin depois que o
publicador republicar JavaScript compilado, ou desabilite/desinstale esse plugin
até que um pacote corrigido esteja disponível.

Use `openclaw.runtimeExtensions` quando os arquivos de runtime publicados não
ficarem nos mesmos caminhos das entradas de origem. Quando presente,
`runtimeExtensions` deve conter exatamente uma entrada para cada entrada de
`extensions`. Listas incompatíveis falham na instalação e na descoberta de
plugins em vez de voltar silenciosamente para caminhos de origem. Se você também
publicar `openclaw.setupEntry`, use `openclaw.runtimeSetupEntry` para seu par
JavaScript compilado; esse arquivo é obrigatório quando declarado.

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

ClawHub é o principal caminho de distribuição para a maioria dos plugins. As
versões empacotadas atuais do OpenClaw já incluem muitos plugins oficiais, então
eles não precisam de instalações npm separadas em configurações normais. Até que
todo plugin mantido pelo OpenClaw tenha migrado para o ClawHub, o OpenClaw ainda
distribui alguns pacotes de plugin `@openclaw/*` no npm para instalações
antigas/personalizadas e fluxos de trabalho npm diretos.

Se o npm reportar um pacote de plugin `@openclaw/*` como obsoleto, essa versão do
pacote vem de uma linha de pacotes externos mais antiga. Use o plugin incluído na
versão atual do OpenClaw ou um checkout local até que um pacote npm mais novo
seja publicado.

| Plugin          | Pacote                     | Documentação                               |
| --------------- | -------------------------- | ------------------------------------------ |
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

### Centrais (incluídos com o OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de modelo (habilitados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` - pesquisa de memória integrada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` - memória de longo prazo baseada em LanceDB com rechamada/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)

    Consulte [Memory LanceDB](/pt-BR/plugins/memory-lancedb) para configuração de
    embeddings compatíveis com OpenAI, exemplos do Ollama, limites de rechamada e solução de problemas.

  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` - Plugin de navegador integrado para a ferramenta de navegador, CLI `openclaw browser`, método de Gateway `browser.request`, runtime de navegador e serviço de controle de navegador padrão (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` - ponte VS Code Copilot Proxy (desabilitada por padrão)

  </Accordion>
</AccordionGroup>

Procurando Plugins de terceiros? Consulte [ClawHub](/pt-BR/clawhub).

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

| Campo              | Descrição                                                 |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Alternância principal (padrão: `true`)                    |
| `allow`            | Lista de permissões de Plugins (opcional)                 |
| `bundledDiscovery` | Modo de descoberta de Plugin integrado (`allowlist` por padrão) |
| `deny`             | Lista de bloqueio de Plugins (opcional; bloqueio prevalece) |
| `load.paths`       | Arquivos/diretórios extras de Plugin                      |
| `slots`            | Seletores de slots exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>`   | Alternâncias por Plugin + configuração                    |

`plugins.allow` é exclusivo. Quando não está vazio, somente Plugins listados podem ser carregados
ou expor ferramentas, mesmo que `tools.allow` contenha `"*"` ou um nome de
ferramenta pertencente a um Plugin específico. Se uma lista de permissões de ferramentas referenciar ferramentas de Plugins, adicione os ids dos Plugins proprietários
a `plugins.allow` ou remova `plugins.allow`; `openclaw doctor` avisa sobre esse
formato.

`plugins.bundledDiscovery` usa `"allowlist"` por padrão para novas configurações, então um
inventário restritivo de `plugins.allow` também bloqueia Plugins de provedores integrados omitidos,
incluindo a descoberta de provedores de pesquisa na web em runtime. O Doctor marca configurações
antigas com listas de permissões restritivas com `"compat"` durante a migração para que upgrades mantenham
o comportamento legado de provedores integrados até que o operador opte pelo modo mais rigoroso.
Um `plugins.allow` vazio ainda é tratado como não definido/aberto.

Alterações de configuração feitas por meio de `/plugins enable` ou `/plugins disable` acionam uma
recarga de Plugins do Gateway em processo. Novos turnos de agente recriam sua lista de ferramentas a partir
do registro de Plugins atualizado. Operações que alteram o código-fonte, como instalar,
atualizar e desinstalar, ainda reiniciam o processo do Gateway porque módulos de Plugin já importados
não podem ser substituídos com segurança no local.

`openclaw plugins list` é um snapshot local do registro/configuração de Plugins. Um
Plugin `enabled` ali significa que o registro persistido e a configuração atual permitem que o
Plugin participe. Isso não prova que um Gateway remoto já em execução
foi recarregado ou reiniciado com o mesmo código de Plugin. Em configurações de VPS/contêiner
com processos wrapper, envie reinícios ou escritas que acionem recarga para o processo real
`openclaw gateway run`, ou use `openclaw gateway restart` contra o
Gateway em execução quando a recarga relatar uma falha.

<Accordion title="Estados de Plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o Plugin existe, mas as regras de habilitação o desligaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de Plugin que a descoberta não encontrou.
  - **Inválido**: o Plugin existe, mas sua configuração não corresponde ao schema declarado. A inicialização do Gateway ignora somente esse Plugin; `openclaw doctor --fix` pode colocar a entrada inválida em quarentena, desabilitando-a e removendo sua carga de configuração.

</Accordion>

## Descoberta e precedência

O OpenClaw procura Plugins nesta ordem (a primeira correspondência prevalece):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` - caminhos explícitos de arquivo ou diretório. Caminhos que apontam
    de volta para os próprios diretórios de Plugins integrados empacotados do OpenClaw são ignorados;
    execute `openclaw doctor --fix` para remover esses aliases obsoletos.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins integrados">
    Enviados com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

Instalações empacotadas e imagens Docker normalmente resolvem Plugins integrados a partir da
árvore compilada `dist/extensions`. Se um diretório de código-fonte de Plugin integrado for
montado por bind sobre o caminho correspondente do código-fonte empacotado, por exemplo
`/app/extensions/synology-chat`, o OpenClaw trata esse diretório de código-fonte montado
como uma sobreposição de código-fonte integrado e o descobre antes do bundle empacotado
`/app/dist/extensions/synology-chat`. Isso mantém os loops de contêiner de mantenedores
funcionando sem alternar todo Plugin integrado de volta para código-fonte TypeScript.
Defina `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forçar bundles dist empacotados
mesmo quando montagens de sobreposição de código-fonte estiverem presentes.

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os Plugins e ignora o trabalho de descoberta/carregamento de Plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse Plugin
- Plugins originados do workspace são **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins integrados seguem o conjunto interno habilitado por padrão, a menos que sejam sobrescritos
- Slots exclusivos podem forçar a habilitação do Plugin selecionado para esse slot
- Alguns Plugins integrados opt-in são habilitados automaticamente quando a configuração nomeia uma
  superfície pertencente ao Plugin, como uma referência de modelo de provedor, configuração de canal ou runtime
  de harness
- Configuração de Plugin obsoleta é preservada enquanto `plugins.enabled: false` está ativo;
  reabilite Plugins antes de executar a limpeza do Doctor se quiser que ids obsoletos sejam removidos
- Rotas Codex da família OpenAI mantêm limites de Plugin separados:
  `openai-codex/*` pertence ao Plugin OpenAI, enquanto o Plugin app-server Codex
  integrado é selecionado por refs canônicas de agente `openai/*`, `agentRuntime.id: "codex"` explícito
  de provedor/modelo, ou refs de modelo legadas `codex/*`

## Solução de problemas de hooks em runtime

Se um Plugin aparecer em `plugins list`, mas efeitos colaterais ou hooks de `register(api)`
não forem executados no tráfego de chat ao vivo, verifique primeiro o seguinte:

- Execute `openclaw gateway status --deep --require-rpc` e confirme se a URL,
  o perfil, o caminho de configuração e o processo do Gateway ativo são os que você está editando.
- Reinicie o Gateway ao vivo após alterações de instalação/configuração/código do Plugin. Em contêineres
  com wrappers, o PID 1 pode ser apenas um supervisor; reinicie ou sinalize o processo filho
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --runtime --json` para confirmar registros de hooks e
  diagnósticos. Hooks de conversa não integrados, como `before_model_resolve`,
  `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`,
  `before_agent_finalize` e `agent_end` precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da resolução de modelo
  para turnos de agente; `llm_output` só é executado depois que uma tentativa de modelo
  produz saída do assistente.
- Para provar o modelo efetivo da sessão, use `openclaw sessions` ou as
  superfícies de sessão/status do Gateway e, ao depurar payloads de provedores, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

### Configuração lenta de ferramentas de Plugin

Se os turnos de agente parecerem travar enquanto preparam ferramentas, habilite o registro de trace e
verifique linhas de temporização de fábricas de ferramentas de Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] factory timings ...
```

O resumo lista o tempo total da fábrica e as fábricas de ferramentas de Plugin mais lentas,
incluindo id do Plugin, nomes declarados das ferramentas, formato do resultado e se a ferramenta é
opcional. Linhas lentas são promovidas a avisos quando uma única fábrica leva
pelo menos 1s ou a preparação total das fábricas de ferramentas de Plugin leva pelo menos 5s.

O OpenClaw armazena em cache resultados bem-sucedidos de fábricas de ferramentas de Plugin para resoluções repetidas
com o mesmo contexto efetivo de requisição. A chave de cache inclui a configuração efetiva
de runtime, workspace, ids de agente/sessão, política de sandbox, configurações de navegador,
contexto de entrega, identidade do solicitante e estado de propriedade, então fábricas que
dependem desses campos confiáveis são reexecutadas quando o contexto muda.

Se um Plugin dominar a temporização, inspecione seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Em seguida, atualize, reinstale ou desabilite esse Plugin. Autores de Plugins devem mover
o carregamento caro de dependências para trás do caminho de execução da ferramenta, em vez de fazê-lo
dentro da fábrica da ferramenta.

### Propriedade duplicada de canal ou ferramenta

Sintomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Isso significa que mais de um Plugin habilitado está tentando possuir o mesmo canal,
fluxo de configuração ou nome de ferramenta. A causa mais comum é um Plugin de canal externo
instalado ao lado de um Plugin integrado que agora fornece o mesmo id de canal.

Etapas de depuração:

- Execute `openclaw plugins list --enabled --verbose` para ver todos os Plugins habilitados
  e suas origens.
- Execute `openclaw plugins inspect <id> --runtime --json` para cada Plugin suspeito e
  compare `channels`, `channelConfigs`, `tools` e diagnósticos.
- Execute `openclaw plugins registry --refresh` após instalar ou remover
  pacotes de Plugin para que os metadados persistidos reflitam a instalação atual.
- Reinicie o Gateway após alterações de instalação, registro ou configuração.

Opções de correção:

- Se um Plugin substituir intencionalmente outro para o mesmo id de canal, o
  Plugin preferido deve declarar `channelConfigs.<channel-id>.preferOver` com
  o id do Plugin de prioridade mais baixa. Consulte [/plugins/manifest#replacing-another-channel-plugin](/pt-BR/plugins/manifest#replacing-another-channel-plugin).
- Se a duplicata for acidental, desabilite um lado com
  `plugins.entries.<plugin-id>.enabled: false` ou remova a instalação obsoleta do Plugin.
- Se você habilitou explicitamente ambos os Plugins, o OpenClaw mantém essa solicitação e
  relata o conflito. Escolha um proprietário para o canal ou renomeie as ferramentas pertencentes ao Plugin
  para que a superfície de runtime seja inequívoca.

## Slots de Plugin (categorias exclusivas)

Algumas categorias são exclusivas (somente uma ativa por vez):

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
| `memory`        | Plugin de memória ativa | `memory-core`     |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (integrado) |

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

openclaw plugins install <package>         # install from npm by default
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

Plugins incluídos são distribuídos com o OpenClaw. Muitos são habilitados por padrão (por exemplo,
provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador
incluído). Outros plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve no local um plugin instalado ou pacote de hooks existente. Use
`openclaw plugins update <id-or-npm-spec>` para atualizações de rotina de plugins npm
rastreados. Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez
de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa lista de permissões antes de habilitá-lo. Se o mesmo id
de plugin estiver presente em `plugins.deny`, a instalação remove essa entrada de negação
obsoleta para que a instalação explícita possa ser carregada imediatamente após a reinicialização.

O OpenClaw mantém um registro local persistente de plugins como o modelo de leitura fria para
inventário de plugins, propriedade de contribuições e planejamento de inicialização. Os fluxos de
instalação, atualização, desinstalação, habilitação e desabilitação atualizam esse registro após
alterar o estado do plugin. O mesmo arquivo `plugins/installs.json` mantém metadados duráveis de
instalação em `installRecords` no nível superior e metadados de manifesto reconstruíveis em
`plugins`. Se o registro estiver ausente, obsoleto ou inválido, `openclaw plugins registry
--refresh` reconstrói sua visualização de manifesto a partir dos registros de instalação, política
de configuração e metadados de manifesto/pacote sem carregar módulos de runtime de plugin.

No modo Nix (`OPENCLAW_NIX_MODE=1`), os mutadores de ciclo de vida de plugin ficam desabilitados.
Gerencie a seleção de pacotes de plugin e a configuração por meio da origem Nix da
instalação; para nix-openclaw, comece pelo
[Guia de início rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado no agente.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro de plugin rastreado e registra a nova especificação para atualizações futuras.
Passar o nome do pacote sem uma versão move uma instalação fixada exata de volta para
a linha de lançamento padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou reescrever a configuração.
Quando `openclaw update` é executado no canal beta, registros de plugin npm e ClawHub
na linha padrão tentam `@beta` primeiro e recorrem a default/latest quando não existe
lançamento beta do plugin. Versões exatas e tags explícitas permanecem fixadas.

`--pin` é exclusivo para npm. Ele não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner integrado de código perigoso. Ela permite que instalações de plugins
e atualizações de plugins prossigam apesar de achados `critical` integrados, mas ainda
não contorna bloqueios de política `before_install` de plugins nem bloqueios por falha de verificação.
As verificações de instalação ignoram arquivos e diretórios comuns de teste, como `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*`, para evitar bloquear mocks de teste empacotados;
entrypoints de runtime de plugin declarados ainda são verificados mesmo que usem um desses
nomes.

Essa flag de CLI se aplica apenas aos fluxos de instalação/atualização de plugins. Instalações
de dependências de Skills apoiadas pelo Gateway usam a substituição de requisição correspondente
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado
de download/instalação de Skills do ClawHub.

Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma verificação, abra o
painel do ClawHub ou execute `clawhub package rescan <name>` para pedir que o ClawHub o verifique
novamente. `--dangerously-force-unsafe-install` afeta apenas instalações na sua própria máquina;
ela não pede que o ClawHub verifique novamente o plugin nem torna público um lançamento bloqueado.

Bundles compatíveis participam do mesmo fluxo de listar/inspecionar/habilitar/desabilitar plugins.
O suporte atual de runtime inclui Skills de bundle, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `lspServers` declarados por manifesto e
`.lsp.json` do Claude, command-skills do Cursor e diretórios de hooks compatíveis do Codex.

`openclaw plugins inspect <id>` também relata capacidades de bundle detectadas, além de entradas
de servidor MCP e LSP compatíveis ou incompatíveis para plugins apoiados por bundle.

Origens de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou caminho
`marketplace.json`, uma abreviação do GitHub como `owner/repo`, uma URL de repositório
do GitHub ou uma URL git. Para marketplaces remotos, as entradas de plugin devem permanecer dentro
do repositório de marketplace clonado e usar apenas origens de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para todos os detalhes.

## Visão geral da API de Plugin

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins mais antigos
ainda podem usar `activate(api)` como um alias legado, mas plugins novos devem
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

O OpenClaw carrega o objeto de entrada e chama `register(api)` durante a ativação do plugin.
O carregador ainda recorre a `activate(api)` para plugins mais antigos, mas plugins incluídos
e novos plugins externos devem tratar `register` como o contrato público.

`api.registrationMode` informa a um plugin por que sua entrada está sendo carregada:

| Modo            | Significado                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação de runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ativos.                   |
| `discovery`     | Descoberta de capacidades somente leitura. Registre provedores e metadados; código de entrada de plugin confiável pode carregar, mas pule efeitos colaterais ativos. |
| `setup-only`    | Carregamento de metadados de configuração de canal por meio de uma entrada leve de configuração.                                  |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                    |
| `cli-metadata`  | Apenas coleta de metadados de comandos da CLI.                                                                                    |

Entradas de plugin que abrem sockets, bancos de dados, workers em segundo plano ou clientes
de longa duração devem proteger esses efeitos colaterais com `api.registrationMode === "full"`.
Carregamentos de descoberta são armazenados em cache separadamente dos carregamentos de ativação e
não substituem o registro em execução do Gateway. A descoberta não ativa, mas não é livre de import:
o OpenClaw pode avaliar a entrada de plugin confiável ou o módulo de plugin de canal para construir
o snapshot. Mantenha os níveis superiores dos módulos leves e sem efeitos colaterais, e mova
clientes de rede, subprocessos, listeners, leituras de credenciais e inicialização de serviços
para trás de caminhos de runtime completo.

Métodos comuns de registro:

| Método                                  | O que registra                 |
| --------------------------------------- | ------------------------------ |
| `registerProvider`                      | Provedor de modelo (LLM)       |
| `registerChannel`                       | Canal de chat                  |
| `registerTool`                          | Ferramenta de agente           |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida         |
| `registerSpeechProvider`                | Texto para fala / STT          |
| `registerRealtimeTranscriptionProvider` | STT por streaming              |
| `registerRealtimeVoiceProvider`         | Voz em tempo real duplex       |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio        |
| `registerImageGenerationProvider`       | Geração de imagem              |
| `registerMusicGenerationProvider`       | Geração de música              |
| `registerVideoGenerationProvider`       | Geração de vídeo               |
| `registerWebFetchProvider`              | Provedor de busca/coleta web   |
| `registerWebSearchProvider`             | Pesquisa web                   |
| `registerHttpRoute`                     | Endpoint HTTP                  |
| `registerCommand` / `registerCli`       | Comandos da CLI                |
| `registerContextEngine`                 | Mecanismo de contexto          |
| `registerService`                       | Serviço em segundo plano       |

Comportamento de proteção de hooks para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de menor prioridade são ignorados.
- `before_tool_call`: `{ block: false }` não tem efeito e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de menor prioridade são ignorados.
- `before_install`: `{ block: false }` não tem efeito e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de menor prioridade são ignorados.
- `message_sending`: `{ cancel: false }` não tem efeito e não limpa um cancelamento anterior.

O app-server nativo do Codex encaminha eventos de ferramentas nativas do Codex de volta para esta superfície de hooks. Plugins podem bloquear ferramentas nativas do Codex por meio de `before_tool_call`, observar resultados por meio de `after_tool_call` e participar das aprovações `PermissionRequest` do Codex. A ponte ainda não reescreve argumentos de ferramentas nativas do Codex. O limite exato de suporte do runtime do Codex está no
[contrato de suporte v1 do harness do Codex](/pt-BR/plugins/codex-harness-runtime#v1-support-contract).

Para o comportamento completo de hooks tipados, consulte a [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Como criar plugins](/pt-BR/plugins/building-plugins) - crie seu próprio plugin
- [Pacotes de plugins](/pt-BR/plugins/bundles) - compatibilidade de pacotes Codex/Claude/Cursor
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - esquema do manifesto
- [Registro de ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) - adicione ferramentas de agente em um plugin
- [Componentes internos do Plugin](/pt-BR/plugins/architecture) - modelo de capacidades e pipeline de carregamento
- [ClawHub](/pt-BR/clawhub) - descoberta de plugins de terceiros
