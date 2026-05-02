---
read_when:
    - Instalando ou configurando plugins
    - Entendendo a descoberta de plugins e as regras de carregamento
    - Trabalhando com pacotes de Plugin compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-02T21:06:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d553c917d9054f4cb5a244ffd0d749c37f6dde230a5887b6b71ba7cf39fcefe5
    source_path: tools/plugin.md
    workflow: 16
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
harnesses de agentes, ferramentas, Skills, fala, transcrição em tempo real, voz
em tempo real, compreensão de mídia, geração de imagem, geração de vídeo, busca
de conteúdo na web, pesquisa na web e muito mais. Alguns Plugins são **core**
(enviados com o OpenClaw), outros são **externos**. A maioria dos Plugins externos
é publicada e descoberta pelo [ClawHub](/pt-BR/tools/clawhub). O npm continua compatível
para instalações diretas e para um conjunto temporário de pacotes de Plugin de
propriedade do OpenClaw enquanto essa migração é concluída.

## Início rápido

Para exemplos de copiar e colar para instalação, listagem, desinstalação,
atualização e publicação, consulte [Gerenciar Plugins](/pt-BR/plugins/manage-plugins).

<Steps>
  <Step title="Veja o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instale um Plugin">
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

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Depois configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>

  <Step title="Gerenciamento nativo do chat">
    Em um Gateway em execução, `/plugins enable` e `/plugins disable`, restritos
    ao proprietário, acionam o recarregador de configuração do Gateway. O Gateway
    recarrega as superfícies de runtime do Plugin no processo, e novas rodadas de
    agente recriam sua lista de ferramentas a partir do registro atualizado.
    `/plugins install` altera o código-fonte do Plugin, então o Gateway solicita
    uma reinicialização em vez de fingir que o processo atual pode recarregar com
    segurança módulos já importados.

  </Step>

  <Step title="Verifique o Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Use `--runtime` quando precisar comprovar ferramentas registradas, serviços,
    métodos de Gateway, hooks ou comandos de CLI pertencentes ao Plugin. O
    `inspect` simples é uma verificação fria de manifesto/registro e evita
    intencionalmente importar o runtime do Plugin.

  </Step>
</Steps>

Se você preferir controle nativo do chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local,
`clawhub:<pkg>` explícito, `npm:<pkg>` explícito, `git:<repo>` explícito ou
especificação de pacote simples via npm.

Se a configuração for inválida, a instalação normalmente falha de forma fechada e
indica `openclaw doctor --fix`. A única exceção de recuperação é um caminho
estreito de reinstalação de Plugin empacotado para Plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.
Durante a inicialização do Gateway, a configuração inválida de um Plugin é isolada
desse Plugin: a inicialização registra o problema em `plugins.entries.<id>.config`,
ignora esse Plugin durante o carregamento e mantém outros Plugins e canais online.
Execute `openclaw doctor --fix` para colocar em quarentena a configuração ruim do
Plugin desabilitando essa entrada de Plugin e removendo sua carga de configuração
inválida; o backup de configuração normal preserva os valores anteriores.
Quando uma configuração de canal referencia um Plugin que não é mais descobrível,
mas o mesmo id de Plugin obsoleto permanece na configuração de Plugin ou nos
registros de instalação, a inicialização do Gateway registra avisos e ignora esse
canal em vez de bloquear todos os outros canais. Execute `openclaw doctor --fix`
para remover as entradas obsoletas de canal/Plugin; chaves de canal desconhecidas
sem evidência de Plugin obsoleto ainda falham na validação para que erros de
digitação permaneçam visíveis.
Se `plugins.enabled: false` estiver definido, referências obsoletas de Plugin são
tratadas como inertes: a inicialização do Gateway ignora o trabalho de
descoberta/carregamento de Plugins, e `openclaw doctor` preserva a configuração
de Plugin desabilitada em vez de removê-la automaticamente. Reabilite Plugins
antes de executar a limpeza do doctor se quiser que ids de Plugin obsoletos sejam
removidos.

A instalação de dependências de Plugin acontece somente durante fluxos explícitos
de instalação/atualização ou reparo pelo doctor. A inicialização do Gateway, o
recarregamento de configuração e a inspeção de runtime não executam gerenciadores
de pacotes nem reparam árvores de dependências. Plugins locais já devem ter suas
dependências instaladas, enquanto Plugins do npm, git e ClawHub são instalados
sob as raízes de Plugin gerenciadas pelo OpenClaw. Dependências npm podem ser
elevadas dentro da raiz npm gerenciada pelo OpenClaw; a instalação/atualização
varre essa raiz gerenciada antes da confiança, e a desinstalação remove pacotes
gerenciados por npm por meio do npm. Plugins externos e caminhos de carregamento
customizados ainda devem ser instalados por meio de `openclaw plugins install`.
Use `openclaw plugins list --json` para ver o `dependencyStatus` estático de cada
Plugin visível sem importar código de runtime nem reparar dependências.
Consulte [Resolução de dependências de Plugin](/pt-BR/plugins/dependency-resolution)
para o ciclo de vida em tempo de instalação.

Checkouts de código-fonte são workspaces pnpm. Se você clonar o OpenClaw para
trabalhar em Plugins empacotados, execute `pnpm install`; então o OpenClaw carrega
Plugins empacotados de `extensions/<id>` para que edições e dependências locais do
pacote sejam usadas diretamente. Instalações simples na raiz com npm são para o
OpenClaw empacotado, não para desenvolvimento em checkout de código-fonte.

## Tipos de Plugin

O OpenClaw reconhece dois formatos de Plugin:

| Formato    | Como funciona                                                     | Exemplos                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo   | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Bundles de Plugin](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um Plugin nativo, comece com [Criação de Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Pontos de entrada de pacote

Pacotes npm de Plugin nativo devem declarar `openclaw.extensions` em
`package.json`. Cada entrada deve permanecer dentro do diretório do pacote e
resolver para um arquivo de runtime legível, ou para um arquivo-fonte TypeScript
com um par JavaScript compilado inferido, como `src/index.ts` para `dist/index.js`.

Use `openclaw.runtimeExtensions` quando arquivos de runtime publicados não
estiverem nos mesmos caminhos das entradas de origem. Quando presente,
`runtimeExtensions` deve conter exatamente uma entrada para cada entrada de
`extensions`. Listas incompatíveis fazem a instalação e a descoberta de Plugins
falharem em vez de recorrer silenciosamente aos caminhos de origem. Se você também
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

### Pacotes npm de propriedade do OpenClaw durante a migração

ClawHub é o principal caminho de distribuição para a maioria dos Plugins. Versões
empacotadas atuais do OpenClaw já incluem muitos Plugins oficiais, então eles não
precisam de instalações npm separadas em configurações normais. Até que todos os
Plugins de propriedade do OpenClaw tenham migrado para o ClawHub, o OpenClaw ainda
envia alguns pacotes de Plugin `@openclaw/*` no npm para instalações antigas/customizadas
e fluxos de trabalho npm diretos.

Se o npm relatar um pacote de Plugin `@openclaw/*` como obsoleto, essa versão do
pacote vem de uma linha antiga de pacotes externos. Use o Plugin empacotado do
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
  <Accordion title="Provedores de modelo (habilitados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — pesquisa de memória empacotada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo baseada em LanceDB com recuperação/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)

    Consulte [Memory LanceDB](/pt-BR/plugins/memory-lancedb) para configuração de
    embeddings compatíveis com OpenAI, exemplos do Ollama, limites de recuperação
    e solução de problemas.

  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — Plugin de navegador empacotado para a ferramenta de navegador, CLI `openclaw browser`, método de Gateway `browser.request`, runtime de navegador e serviço padrão de controle do navegador (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — ponte VS Code Copilot Proxy (desabilitada por padrão)

  </Accordion>
</AccordionGroup>

Procurando Plugins de terceiros? Consulte [Plugins da comunidade](/pt-BR/plugins/community).

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
| `allow`          | Lista de permissão de Plugins (opcional)                  |
| `deny`           | Lista de bloqueio de Plugins (opcional; deny prevalece)   |
| `load.paths`     | Arquivos/diretórios extras de Plugin                      |
| `slots`          | Seletores de slots exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias por Plugin + configuração                    |

`plugins.allow` é exclusivo. Quando não está vazio, somente Plugins listados
podem carregar ou expor ferramentas, mesmo que `tools.allow` contenha `"*"` ou
um nome específico de ferramenta pertencente a um Plugin. Se uma lista de
permissão de ferramentas referencia ferramentas de Plugin, adicione os ids dos
Plugins proprietários a `plugins.allow` ou remova `plugins.allow`; `openclaw doctor`
avisa sobre esse formato.

Alterações de configuração feitas por meio de `/plugins enable` ou `/plugins disable` acionam um recarregamento de Plugin do Gateway em processo. Novos turnos de agentes reconstroem sua lista de ferramentas a partir do registro de Plugins atualizado. Operações que alteram a origem, como instalação, atualização e desinstalação, ainda reiniciam o processo do Gateway porque módulos de Plugin já importados não podem ser substituídos com segurança no local.

`openclaw plugins list` é um snapshot local do registro/configuração de Plugins. Um Plugin `enabled` ali significa que o registro persistido e a configuração atual permitem que o Plugin participe. Isso não prova que um Gateway remoto já em execução tenha recarregado ou reiniciado com o mesmo código de Plugin. Em configurações VPS/contêiner com processos wrapper, envie reinicializações ou gravações que acionem recarregamento para o processo real `openclaw gateway run`, ou use `openclaw gateway restart` contra o Gateway em execução quando o recarregamento relatar uma falha.

<Accordion title="Estados de Plugin: desativado vs ausente vs inválido">
  - **Desativado**: o Plugin existe, mas as regras de ativação o desligaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de Plugin que a descoberta não encontrou.
  - **Inválido**: o Plugin existe, mas sua configuração não corresponde ao esquema declarado. A inicialização do Gateway ignora apenas esse Plugin; `openclaw doctor --fix` pode colocar a entrada inválida em quarentena desativando-a e removendo seu payload de configuração.

</Accordion>

## Descoberta e precedência

O OpenClaw procura Plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos de arquivos ou diretórios. Caminhos que apontam de volta para os diretórios de Plugins empacotados incluídos do próprio OpenClaw são ignorados;
    execute `openclaw doctor --fix` para remover esses aliases obsoletos.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluídos">
    Enviados com o OpenClaw. Muitos são ativados por padrão (provedores de modelo, fala).
    Outros exigem ativação explícita.
  </Step>
</Steps>

Instalações empacotadas e imagens Docker normalmente resolvem Plugins incluídos a partir da árvore compilada `dist/extensions`. Se um diretório de código-fonte de Plugin incluído for montado por bind sobre o caminho de origem empacotado correspondente, por exemplo `/app/extensions/synology-chat`, o OpenClaw trata esse diretório de origem montado como uma sobreposição de origem incluída e o descobre antes do bundle empacotado `/app/dist/extensions/synology-chat`. Isso mantém os loops de contêiner de mantenedores funcionando sem alternar todos os Plugins incluídos de volta para o código-fonte TypeScript. Defina `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forçar bundles dist empacotados mesmo quando montagens de sobreposição de origem estiverem presentes.

### Regras de ativação

- `plugins.enabled: false` desativa todos os Plugins e ignora o trabalho de descoberta/carregamento de Plugins
- `plugins.deny` sempre vence sobre allow
- `plugins.entries.\<id\>.enabled: false` desativa esse Plugin
- Plugins originados do workspace são **desativados por padrão** (devem ser ativados explicitamente)
- Plugins incluídos seguem o conjunto interno ativado por padrão, a menos que sejam sobrescritos
- Slots exclusivos podem forçar a ativação do Plugin selecionado para esse slot
- Alguns Plugins incluídos opcionais são ativados automaticamente quando a configuração nomeia uma superfície pertencente a um Plugin, como uma ref de modelo de provedor, configuração de canal ou runtime de harness
- Configuração obsoleta de Plugin é preservada enquanto `plugins.enabled: false` está ativo;
  reative os Plugins antes de executar a limpeza do doctor se quiser remover ids obsoletos
- Rotas Codex da família OpenAI mantêm limites de Plugin separados:
  `openai-codex/*` pertence ao Plugin OpenAI, enquanto o Plugin app-server Codex incluído é selecionado por `agentRuntime.id: "codex"` ou refs de modelo legadas `codex/*`

## Solução de problemas de hooks de runtime

Se um Plugin aparece em `plugins list`, mas efeitos colaterais ou hooks de `register(api)` não são executados no tráfego de chat ao vivo, verifique primeiro:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a URL ativa do Gateway, o perfil, o caminho da configuração e o processo são aqueles que você está editando.
- Reinicie o Gateway ao vivo após alterações de instalação/configuração/código de Plugin. Em contêineres wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou sinalize o processo filho `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --runtime --json` para confirmar registros de hooks e diagnósticos. Hooks de conversa não incluídos, como `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`, precisam de `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da resolução de modelo para turnos de agentes; `llm_output` só é executado depois que uma tentativa de modelo produz saída de assistente.
- Para prova do modelo efetivo da sessão, use `openclaw sessions` ou as superfícies de sessão/status do Gateway e, ao depurar payloads de provedor, inicie o Gateway com `--raw-stream --raw-stream-path <path>`.

### Configuração lenta de ferramentas de Plugin

Se turnos de agentes parecem travar enquanto preparam ferramentas, ative o log de trace e verifique linhas de tempo de factory de ferramentas de Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] factory timings ...
```

O resumo lista o tempo total de factory e as factories de ferramentas de Plugin mais lentas, incluindo id do Plugin, nomes de ferramentas declarados, formato do resultado e se a ferramenta é opcional. Linhas lentas são promovidas a avisos quando uma única factory leva pelo menos 1s ou a preparação total de factory de ferramentas de Plugin leva pelo menos 5s.

O OpenClaw armazena em cache resultados bem-sucedidos de factory de ferramentas de Plugin para resoluções repetidas com o mesmo contexto de solicitação efetivo. A chave de cache inclui a configuração efetiva de runtime, workspace, ids de agente/sessão, política de sandbox, configurações de navegador, contexto de entrega, identidade do solicitante e estado de propriedade, portanto factories que dependem desses campos confiáveis são reexecutadas quando o contexto muda.

Se um Plugin domina o tempo, inspecione seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Em seguida, atualize, reinstale ou desative esse Plugin. Autores de Plugins devem mover o carregamento caro de dependências para trás do caminho de execução da ferramenta em vez de fazê-lo dentro da factory da ferramenta.

### Propriedade duplicada de canal ou ferramenta

Sintomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Isso significa que mais de um Plugin ativado está tentando ser dono do mesmo canal, fluxo de configuração ou nome de ferramenta. A causa mais comum é um Plugin de canal externo instalado ao lado de um Plugin incluído que agora fornece o mesmo id de canal.

Etapas de depuração:

- Execute `openclaw plugins list --enabled --verbose` para ver todos os Plugins ativados e sua origem.
- Execute `openclaw plugins inspect <id> --runtime --json` para cada Plugin suspeito e compare `channels`, `channelConfigs`, `tools` e diagnósticos.
- Execute `openclaw plugins registry --refresh` após instalar ou remover pacotes de Plugin para que os metadados persistidos reflitam a instalação atual.
- Reinicie o Gateway após alterações de instalação, registro ou configuração.

Opções de correção:

- Se um Plugin substitui intencionalmente outro para o mesmo id de canal, o Plugin preferido deve declarar `channelConfigs.<channel-id>.preferOver` com o id de Plugin de prioridade menor. Consulte [/plugins/manifest#replacing-another-channel-plugin](/pt-BR/plugins/manifest#replacing-another-channel-plugin).
- Se a duplicidade for acidental, desative um lado com `plugins.entries.<plugin-id>.enabled: false` ou remova a instalação obsoleta do Plugin.
- Se você ativou explicitamente ambos os Plugins, o OpenClaw mantém essa solicitação e relata o conflito. Escolha um proprietário para o canal ou renomeie ferramentas pertencentes a Plugins para que a superfície de runtime seja inequívoca.

## Slots de Plugin (categorias exclusivas)

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
| `memory`        | Plugin de Active memory | `memory-core`       |
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

Plugins incluídos são enviados com o OpenClaw. Muitos são ativados por padrão (por exemplo, provedores de modelo incluídos, provedores de fala incluídos e o Plugin de navegador incluído). Outros Plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve no local um Plugin instalado existente ou hook pack. Use `openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de Plugins npm rastreados. Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o id do Plugin instalado a essa allowlist antes de ativá-lo. Se o mesmo id de Plugin estiver presente em `plugins.deny`, a instalação remove essa entrada deny obsoleta para que a instalação explícita possa ser carregada imediatamente após reiniciar.

OpenClaw mantém um registro local persistente de plugins como o modelo de leitura fria para
inventário de plugins, propriedade de contribuições e planejamento de inicialização. Fluxos de instalação, atualização,
desinstalação, habilitação e desabilitação atualizam esse registro depois de alterar o estado do plugin. O mesmo arquivo `plugins/installs.json` mantém metadados duráveis de instalação em
`installRecords` de nível superior e metadados de manifesto reconstruíveis em `plugins`. Se
o registro estiver ausente, obsoleto ou inválido, `openclaw plugins registry
--refresh` reconstrói sua visão de manifesto a partir de registros de instalação, política de configuração e
metadados de manifesto/pacote sem carregar módulos de runtime do plugin.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro de plugin rastreado e registra a nova especificação para atualizações futuras.
Passar o nome do pacote sem uma versão move uma instalação fixada exata de volta para
a linha de lançamento padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou reescrever a configuração.
Quando `openclaw update` é executado no canal beta, registros de plugins npm e ClawHub
na linha padrão tentam `@beta` primeiro e voltam para padrão/latest quando não existe
lançamento beta do plugin. Versões exatas e tags explícitas continuam fixadas.

`--pin` é exclusivo para npm. Ele não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados de origem de marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner de código perigoso integrado. Ele permite que instalações de plugins
e atualizações de plugins continuem após achados `critical` integrados, mas ainda
não ignora bloqueios de política `before_install` do plugin nem bloqueios por falha de varredura.
Varreduras de instalação ignoram arquivos e diretórios de teste comuns, como `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*`, para evitar bloquear mocks de teste empacotados;
entrypoints de runtime de plugin declarados ainda são verificados mesmo se usarem um desses
nomes.

Essa flag de CLI se aplica apenas aos fluxos de instalação/atualização de plugins. Instalações de
dependências de skill apoiadas pelo Gateway usam a substituição de solicitação correspondente
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo
separado de download/instalação de skill do ClawHub.

Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma varredura, abra o
painel do ClawHub ou execute `clawhub package rescan <name>` para pedir que o ClawHub o verifique
novamente. `--dangerously-force-unsafe-install` afeta apenas instalações na sua própria
máquina; ele não pede ao ClawHub para verificar novamente o plugin nem torna público um lançamento
bloqueado.

Bundles compatíveis participam do mesmo fluxo de listar/inspecionar/habilitar/desabilitar
plugins. O suporte de runtime atual inclui Skills de bundle, Skills de comando do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude e `lspServers`
declarados no manifesto, Skills de comando do Cursor e diretórios de hooks compatíveis
do Codex.

`openclaw plugins inspect <id>` também relata capacidades de bundle detectadas, além de
entradas de servidor MCP e LSP compatíveis ou incompatíveis para plugins baseados em bundle.

Origens de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou caminho
`marketplace.json`, uma abreviação do GitHub como `owner/repo`, uma URL de repositório
do GitHub ou uma URL git. Para marketplaces remotos, entradas de plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas origens de caminho relativas.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de Plugin

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins mais antigos
ainda podem usar `activate(api)` como alias legado, mas novos plugins devem
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
O loader ainda recorre a `activate(api)` para plugins mais antigos,
mas plugins incluídos e novos plugins externos devem tratar `register` como o
contrato público.

`api.registrationMode` informa a um plugin por que sua entrada está sendo carregada:

| Modo            | Significado                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação de runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ativos.                              |
| `discovery`     | Descoberta de capacidades somente leitura. Registre provedores e metadados; código de entrada de plugin confiável pode carregar, mas pule efeitos colaterais ativos. |
| `setup-only`    | Carregamento de metadados de configuração de canal por meio de uma entrada de configuração leve.                                                                |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                                         |
| `cli-metadata`  | Apenas coleta de metadados de comandos da CLI.                                                                                            |

Entradas de plugin que abrem sockets, bancos de dados, workers em segundo plano ou clientes
de longa duração devem proteger esses efeitos colaterais com `api.registrationMode === "full"`.
Carregamentos de descoberta são armazenados em cache separadamente dos carregamentos de ativação e não substituem
o registro em execução do Gateway. A descoberta não ativa, mas não é livre de importação:
o OpenClaw pode avaliar a entrada de plugin confiável ou o módulo de plugin de canal para montar
o snapshot. Mantenha os níveis superiores de módulos leves e sem efeitos colaterais, e mova
clientes de rede, subprocessos, listeners, leituras de credenciais e inicialização de serviços
para trás de caminhos de runtime completo.

Métodos comuns de registro:

| Método                                  | O que registra           |
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
| `registerWebFetchProvider`              | Provedor de busca/coleta na Web |
| `registerWebSearchProvider`             | Pesquisa na Web                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos da CLI                |
| `registerContextEngine`                 | Motor de contexto              |
| `registerService`                       | Serviço em segundo plano          |

Comportamento de guarda de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade menor são ignorados.
- `before_tool_call`: `{ block: false }` é uma não operação e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade menor são ignorados.
- `before_install`: `{ block: false }` é uma não operação e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade menor são ignorados.
- `message_sending`: `{ cancel: false }` é uma não operação e não limpa um cancelamento anterior.

Execuções do app-server nativo do Codex encaminham eventos de ferramentas nativas do Codex de volta para esta
superfície de hooks. Plugins podem bloquear ferramentas nativas do Codex por meio de `before_tool_call`,
observar resultados por meio de `after_tool_call` e participar de aprovações
`PermissionRequest` do Codex. A ponte ainda não reescreve argumentos de ferramentas nativas do Codex.
O limite exato de suporte ao runtime do Codex está no
[contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

Para o comportamento completo de hooks tipados, consulte a [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Bundles de plugins](/pt-BR/plugins/bundles) — compatibilidade de bundles Codex/Claude/Cursor
- [Manifesto de plugin](/pt-BR/plugins/manifest) — esquema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um plugin
- [Internos de plugins](/pt-BR/plugins/architecture) — modelo de capacidades e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
