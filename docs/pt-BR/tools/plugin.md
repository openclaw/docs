---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de Plugin
    - Trabalhando com pacotes de Plugin compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar e gerenciar plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-06T18:01:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
arneses de agente, ferramentas, skills, fala, transcrição em tempo real, voz em
tempo real, compreensão de mídia, geração de imagem, geração de vídeo, busca na
web, pesquisa na web e mais. Alguns plugins são **core** (distribuídos com o OpenClaw), outros
são **externos**. A maioria dos plugins externos é publicada e descoberta por meio do
[ClawHub](/pt-BR/tools/clawhub). O npm continua compatível para instalações diretas e para um
conjunto temporário de pacotes de Plugin pertencentes ao OpenClaw enquanto essa migração termina.

## Início rápido

Para exemplos de copiar e colar de instalação, listagem, desinstalação, atualização e publicação, consulte
[Gerenciar plugins](/pt-BR/plugins/manage-plugins).

<Steps>
  <Step title="Ver o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar um Plugin">
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

    Depois configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>

  <Step title="Gerenciamento nativo do chat">
    Em um Gateway em execução, `/plugins enable` e `/plugins disable` somente para o proprietário
    acionam o recarregador de configuração do Gateway. O Gateway recarrega as superfícies
    de runtime do Plugin no processo, e novas rodadas do agente reconstroem sua lista de ferramentas a partir do
    registro atualizado. `/plugins install` altera o código-fonte do Plugin, então o
    Gateway solicita uma reinicialização em vez de fingir que o processo atual pode
    recarregar com segurança módulos já importados.

  </Step>

  <Step title="Verificar o Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # If the plugin registered a CLI root, run one command from that root.
    openclaw <plugin-command> --help
    ```

    Use `--runtime` quando precisar comprovar ferramentas registradas, serviços, métodos do Gateway,
    hooks ou comandos de CLI pertencentes ao Plugin. `inspect` simples é uma verificação fria de
    manifesto/registro e evita intencionalmente importar o runtime do Plugin.

  </Step>
</Steps>

Se preferir controle nativo do chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>`
explícito, `npm:<pkg>` explícito, `npm-pack:<path.tgz>` explícito,
`git:<repo>` explícito ou especificação de pacote sem prefixo via npm.

Se a configuração for inválida, a instalação normalmente falha fechada e aponta para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho estreito de reinstalação
de Plugin incluído para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.
Durante a inicialização do Gateway, configuração inválida de Plugin falha fechada como qualquer outra configuração inválida.
Execute `openclaw doctor --fix` para colocar em quarentena a configuração incorreta do Plugin,
desabilitando essa entrada de Plugin e removendo seu payload de configuração inválido; o backup normal
da configuração mantém os valores anteriores.
Quando uma configuração de canal referencia um Plugin que não é mais descobrível, mas o
mesmo id obsoleto de Plugin permanece na configuração de Plugin ou nos registros de instalação, a inicialização do Gateway
registra avisos e ignora esse canal em vez de bloquear todos os outros canais.
Execute `openclaw doctor --fix` para remover as entradas obsoletas de canal/Plugin; chaves de
canal desconhecidas sem evidência de Plugin obsoleto ainda falham na validação para que erros de digitação continuem
visíveis.
Se `plugins.enabled: false` estiver definido, referências obsoletas de Plugin são tratadas como inertes:
a inicialização do Gateway ignora o trabalho de descoberta/carregamento de Plugin e `openclaw doctor` preserva
a configuração de Plugin desabilitada em vez de removê-la automaticamente. Reabilite plugins antes de
executar a limpeza do doctor se quiser remover ids obsoletos de Plugin.

A instalação de dependências de Plugin acontece somente durante fluxos explícitos de instalação/atualização ou
reparo do doctor. A inicialização do Gateway, o recarregamento de configuração e a inspeção de runtime
não executam gerenciadores de pacotes nem reparam árvores de dependências. Plugins locais já devem
ter suas dependências instaladas, enquanto plugins npm, git e ClawHub são
instalados nas raízes gerenciadas de Plugin do OpenClaw. Dependências npm podem ser içadas
dentro da raiz npm gerenciada do OpenClaw; instalação/atualização varre essa raiz gerenciada antes
da confiança, e a desinstalação remove pacotes gerenciados por npm por meio do npm. Plugins externos
e caminhos de carregamento personalizados ainda devem ser instalados por meio de `openclaw plugins install`.
Use `openclaw plugins list --json` para ver o `dependencyStatus` estático de cada
Plugin visível sem importar código de runtime nem reparar dependências.
Consulte [Resolução de dependências de Plugin](/pt-BR/plugins/dependency-resolution) para o
ciclo de vida em tempo de instalação.

### Propriedade de caminho de Plugin bloqueado

Se os diagnósticos de Plugin disserem
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e a validação de configuração vier em seguida com `plugin present but blocked`, o OpenClaw encontrou
arquivos de Plugin pertencentes a um usuário Unix diferente do processo que os está carregando.
Mantenha a configuração do Plugin em vigor; corrija a propriedade do sistema de arquivos ou execute
o OpenClaw como o mesmo usuário que possui o diretório de estado.

Para instalações Docker, a imagem oficial executa como `node` (uid `1000`), então os
diretórios de configuração e workspace do OpenClaw montados por bind no host normalmente devem ser
pertencentes ao uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se você executar intencionalmente o OpenClaw como root, repare a raiz gerenciada de Plugin para
propriedade de root em vez disso:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Depois de corrigir a propriedade, execute novamente `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` para que o registro persistido de Plugin corresponda
aos arquivos reparados.

Para instalações npm, seletores mutáveis como `latest` ou uma dist-tag são resolvidos
antes da instalação e depois fixados na versão exata verificada na raiz npm gerenciada
do OpenClaw. Depois que o npm termina, o OpenClaw verifica se a entrada instalada de
`package-lock.json` ainda corresponde à versão resolvida e à integridade. Se
o npm gravar metadados de pacote diferentes, a instalação falha e o pacote gerenciado
é revertido em vez de aceitar um artefato de Plugin diferente.
Raízes npm gerenciadas também herdam os `overrides` npm em nível de pacote do OpenClaw, então
pins de segurança que protegem o host empacotado também se aplicam a dependências içadas de
Plugin externo.

Checkouts de código-fonte são workspaces pnpm. Se você clonar o OpenClaw para trabalhar em plugins incluídos,
execute `pnpm install`; o OpenClaw então carrega plugins incluídos a partir de
`extensions/<id>` para que edições e dependências locais do pacote sejam usadas diretamente.
Instalações simples na raiz npm são para o OpenClaw empacotado, não para desenvolvimento em
checkout de código-fonte.

## Tipos de Plugin

O OpenClaw reconhece dois formatos de Plugin:

| Formato    | Como funciona                                                     | Exemplos                                               |
| ---------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo   | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Bundles de Plugin](/pt-BR/plugins/bundles) para detalhes de bundle.

Se você estiver escrevendo um Plugin nativo, comece com [Criando Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Pontos de entrada de pacote

Pacotes npm de Plugin nativo devem declarar `openclaw.extensions` em `package.json`.
Cada entrada deve permanecer dentro do diretório do pacote e resolver para um arquivo de runtime
legível, ou para um arquivo-fonte TypeScript com um par JavaScript compilado inferido
como `src/index.ts` para `dist/index.js`.
Instalações empacotadas devem enviar essa saída de runtime JavaScript. O fallback de
fonte TypeScript é para checkouts de código-fonte e caminhos de desenvolvimento local, não para
pacotes npm instalados na raiz gerenciada de Plugin do OpenClaw.

Se um aviso de pacote gerenciado disser que ele `requires compiled runtime output for
TypeScript entry ...`, o pacote foi publicado sem os arquivos JavaScript
de que o OpenClaw precisa em runtime. Isso é um problema de empacotamento do Plugin, não um problema de configuração
local. Atualize ou reinstale o Plugin depois que o publicador republicar o JavaScript
compilado, ou desabilite/desinstale esse Plugin até que um pacote corrigido esteja disponível.

Use `openclaw.runtimeExtensions` quando arquivos de runtime publicados não estiverem nos
mesmos caminhos das entradas de origem. Quando presente, `runtimeExtensions` deve conter
exatamente uma entrada para cada entrada de `extensions`. Listas incompatíveis fazem a instalação e
a descoberta de Plugin falharem em vez de recorrer silenciosamente a caminhos de origem. Se você também
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

### Pacotes npm pertencentes ao OpenClaw durante a migração

ClawHub é o principal caminho de distribuição para a maioria dos plugins. Versões empacotadas atuais
do OpenClaw já incluem muitos plugins oficiais, então eles não precisam de
instalações npm separadas em configurações normais. Até que todo Plugin pertencente ao OpenClaw tenha
migrado para o ClawHub, o OpenClaw ainda distribui alguns pacotes de Plugin `@openclaw/*` no
npm para instalações antigas/personalizadas e fluxos de trabalho diretos com npm.

Se o npm relatar um pacote de Plugin `@openclaw/*` como obsoleto, essa versão do pacote
é de uma linha antiga de pacotes externos. Use o Plugin incluído no
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

### Core (distribuído com o OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de modelo (habilitados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` - busca de memória integrada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` - memória de longo prazo baseada em LanceDB com recuperação/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)

    Consulte [Memory LanceDB](/pt-BR/plugins/memory-lancedb) para configuração de embeddings compatível com OpenAI, exemplos com Ollama, limites de recuperação e solução de problemas.

  </Accordion>

  <Accordion title="Provedores de fala (ativados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` - Plugin de navegador integrado para a ferramenta de navegador, CLI `openclaw browser`, método de Gateway `browser.request`, runtime de navegador e serviço padrão de controle de navegador (ativado por padrão; desative antes de substituí-lo)
    - `copilot-proxy` - ponte do VS Code Copilot Proxy (desativada por padrão)

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

| Campo              | Descrição                                                 |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Alternância principal (padrão: `true`)                    |
| `allow`            | Lista de permissões de Plugins (opcional)                 |
| `bundledDiscovery` | Modo de descoberta de Plugin integrado (`allowlist` por padrão) |
| `deny`             | Lista de bloqueio de Plugins (opcional; bloqueio prevalece) |
| `load.paths`       | Arquivos/diretórios extras de Plugin                      |
| `slots`            | Seletores de slots exclusivos (ex.: `memory`, `contextEngine`) |
| `entries.\<id\>`   | Alternâncias + configuração por Plugin                    |

`plugins.allow` é exclusiva. Quando não está vazia, somente os Plugins listados podem carregar ou expor ferramentas, mesmo que `tools.allow` contenha `"*"` ou um nome de ferramenta específico pertencente a um Plugin. Se uma lista de permissões de ferramentas referenciar ferramentas de Plugins, adicione os ids dos Plugins proprietários a `plugins.allow` ou remova `plugins.allow`; `openclaw doctor` avisa sobre esse formato.

`plugins.bundledDiscovery` usa `"allowlist"` como padrão para novas configurações, portanto um inventário restritivo em `plugins.allow` também bloqueia Plugins de provedores integrados omitidos, incluindo a descoberta de provedores de busca na Web em runtime. O doctor marca configurações antigas com lista de permissões restritiva com `"compat"` durante a migração, para que atualizações mantenham o comportamento legado de provedores integrados até que o operador opte pelo modo mais rigoroso. Um `plugins.allow` vazio ainda é tratado como não definido/aberto.

Alterações de configuração feitas por `/plugins enable` ou `/plugins disable` acionam um recarregamento de Plugins do Gateway no processo. Novos turnos de agente recriam a lista de ferramentas a partir do registro de Plugins atualizado. Operações que alteram código-fonte, como instalar, atualizar e desinstalar, ainda reiniciam o processo do Gateway porque módulos de Plugin já importados não podem ser substituídos com segurança no lugar.

`openclaw plugins list` é um snapshot local do registro/configuração de Plugins. Um Plugin `enabled` ali significa que o registro persistido e a configuração atual permitem que o Plugin participe. Isso não prova que um Gateway remoto já em execução recarregou ou reiniciou com o mesmo código de Plugin. Em configurações de VPS/contêiner com processos wrapper, envie reinícios ou escritas que acionem recarregamento ao processo real `openclaw gateway run`, ou use `openclaw gateway restart` contra o Gateway em execução quando o recarregamento relatar uma falha.

<Accordion title="Estados de Plugin: desativado vs ausente vs inválido">
  - **Desativado**: o Plugin existe, mas as regras de ativação o desligaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de Plugin que a descoberta não encontrou.
  - **Inválido**: o Plugin existe, mas sua configuração não corresponde ao schema declarado. A inicialização do Gateway ignora somente esse Plugin; `openclaw doctor --fix` pode colocar a entrada inválida em quarentena desativando-a e removendo seu payload de configuração.

</Accordion>

## Descoberta e precedência

O OpenClaw procura Plugins nesta ordem (a primeira correspondência prevalece):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` - caminhos explícitos de arquivo ou diretório. Caminhos que apontam de volta para os próprios diretórios empacotados de Plugins integrados do OpenClaw são ignorados; execute `openclaw doctor --fix` para remover esses aliases obsoletos.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins integrados">
    Enviados com o OpenClaw. Muitos são ativados por padrão (provedores de modelo, fala). Outros exigem ativação explícita.
  </Step>
</Steps>

Instalações empacotadas e imagens Docker normalmente resolvem Plugins integrados a partir da árvore compilada `dist/extensions`. Se um diretório-fonte de Plugin integrado for montado por bind sobre o caminho-fonte empacotado correspondente, por exemplo `/app/extensions/synology-chat`, o OpenClaw trata esse diretório-fonte montado como uma sobreposição de fonte integrada e o descobre antes do pacote empacotado `/app/dist/extensions/synology-chat`. Isso mantém os loops de contêiner de mantenedores funcionando sem alternar todos os Plugins integrados de volta para código-fonte TypeScript. Defina `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forçar pacotes dist empacotados mesmo quando montagens de sobreposição de fonte estiverem presentes.

### Regras de ativação

- `plugins.enabled: false` desativa todos os Plugins e ignora o trabalho de descoberta/carregamento de Plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desativa esse Plugin
- Plugins originados do workspace ficam **desativados por padrão** (devem ser explicitamente ativados)
- Plugins integrados seguem o conjunto embutido ativado por padrão, salvo substituição
- Slots exclusivos podem forçar a ativação do Plugin selecionado para esse slot
- Alguns Plugins integrados opt-in são ativados automaticamente quando a configuração nomeia uma superfície pertencente a um Plugin, como uma referência de modelo de provedor, configuração de canal ou runtime de harness
- Configuração obsoleta de Plugin é preservada enquanto `plugins.enabled: false` está ativo; reative Plugins antes de executar a limpeza do doctor se quiser remover ids obsoletos
- Rotas Codex da família OpenAI mantêm limites de Plugin separados: `openai-codex/*` pertence ao Plugin OpenAI, enquanto o Plugin app-server Codex integrado é selecionado por `agentRuntime.id: "codex"` ou referências de modelo legadas `codex/*`

## Solução de problemas de hooks de runtime

Se um Plugin aparecer em `plugins list`, mas os efeitos colaterais de `register(api)` ou hooks não forem executados no tráfego de chat ao vivo, verifique primeiro:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a URL, o perfil, o caminho de configuração e o processo ativos do Gateway são aqueles que você está editando.
- Reinicie o Gateway ao vivo após alterações de instalação/configuração/código de Plugin. Em contêineres wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou sinalize o processo filho `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --runtime --json` para confirmar registros de hooks e diagnósticos. Hooks de conversa não integrados como `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end` precisam de `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da resolução de modelo para turnos de agente; `llm_output` só é executado depois que uma tentativa de modelo produz saída do assistente.
- Para comprovar o modelo efetivo da sessão, use `openclaw sessions` ou as superfícies de sessão/status do Gateway e, ao depurar payloads de provedor, inicie o Gateway com `--raw-stream --raw-stream-path <path>`.

### Configuração lenta de ferramentas de Plugin

Se os turnos de agente parecerem travar ao preparar ferramentas, ative o registro de rastreamento e verifique linhas de tempo de fábrica de ferramentas de Plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] factory timings ...
```

O resumo lista o tempo total de fábrica e as fábricas de ferramentas de Plugin mais lentas, incluindo id do Plugin, nomes de ferramentas declarados, formato do resultado e se a ferramenta é opcional. Linhas lentas são promovidas a avisos quando uma única fábrica leva pelo menos 1s ou a preparação total de fábricas de ferramentas de Plugin leva pelo menos 5s.

O OpenClaw armazena em cache resultados bem-sucedidos de fábricas de ferramentas de Plugin para resoluções repetidas com o mesmo contexto efetivo de solicitação. A chave de cache inclui a configuração efetiva de runtime, workspace, ids de agente/sessão, política de sandbox, configurações de navegador, contexto de entrega, identidade do solicitante e estado de propriedade, portanto fábricas que dependem desses campos confiáveis são executadas novamente quando o contexto muda.

Se um Plugin dominar o tempo, inspecione seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Depois atualize, reinstale ou desative esse Plugin. Autores de Plugins devem mover o carregamento caro de dependências para trás do caminho de execução da ferramenta, em vez de fazê-lo dentro da fábrica da ferramenta.

### Propriedade duplicada de canal ou ferramenta

Sintomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Isso significa que mais de um Plugin ativado está tentando ser proprietário do mesmo canal, fluxo de configuração ou nome de ferramenta. A causa mais comum é um Plugin externo de canal instalado ao lado de um Plugin integrado que agora fornece o mesmo id de canal.

Etapas de depuração:

- Execute `openclaw plugins list --enabled --verbose` para ver todos os Plugins ativados e sua origem.
- Execute `openclaw plugins inspect <id> --runtime --json` para cada Plugin suspeito e compare `channels`, `channelConfigs`, `tools` e diagnósticos.
- Execute `openclaw plugins registry --refresh` após instalar ou remover pacotes de Plugin para que os metadados persistidos reflitam a instalação atual.
- Reinicie o Gateway após alterações de instalação, registro ou configuração.

Opções de correção:

- Se um Plugin substituir intencionalmente outro para o mesmo id de canal, o Plugin preferido deve declarar `channelConfigs.<channel-id>.preferOver` com o id do Plugin de prioridade mais baixa. Consulte [/plugins/manifest#replacing-another-channel-plugin](/pt-BR/plugins/manifest#replacing-another-channel-plugin).
- Se a duplicação for acidental, desative um dos lados com `plugins.entries.<plugin-id>.enabled: false` ou remova a instalação obsoleta do Plugin.
- Se você ativou explicitamente ambos os Plugins, o OpenClaw mantém essa solicitação e relata o conflito. Escolha um proprietário para o canal ou renomeie ferramentas pertencentes a Plugins para que a superfície de runtime fique inequívoca.

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

| Slot            | O que ele controla      | Padrão              |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin de memória ativo | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (embutido) |

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

Plugins incluídos são distribuídos com o OpenClaw. Muitos vêm habilitados por padrão (por exemplo,
provedores de modelo incluídos, provedores de fala incluídos e o plugin de navegador
incluído). Outros plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado existente ou um pacote de hooks no mesmo local. Use
`openclaw plugins update <id-or-npm-spec>` para atualizações de rotina de plugins npm
rastreados. Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez
de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa lista de permissões antes de habilitá-lo. Se o mesmo id de plugin
estiver presente em `plugins.deny`, a instalação remove essa entrada de negação obsoleta para que a
instalação explícita possa ser carregada imediatamente após a reinicialização.

O OpenClaw mantém um registro local persistido de plugins como o modelo de leitura fria para
inventário de plugins, propriedade de contribuições e planejamento de inicialização. Os fluxos de instalação, atualização,
desinstalação, habilitação e desabilitação atualizam esse registro depois de alterar o estado dos plugins. O mesmo arquivo `plugins/installs.json` mantém metadados duráveis de instalação em
`installRecords` de nível superior e metadados de manifesto reconstruíveis em `plugins`. Se
o registro estiver ausente, obsoleto ou inválido, `openclaw plugins registry
--refresh` reconstrói sua visão de manifesto a partir dos registros de instalação, política de configuração e
metadados de manifesto/pacote sem carregar módulos de runtime de plugins.

No modo Nix (`OPENCLAW_NIX_MODE=1`), mutadores de ciclo de vida de plugins são desabilitados.
Gerencie a seleção de pacotes de plugins e a configuração pela origem Nix da
instalação; para nix-openclaw, comece pelo
[Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) centrado no agente.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro do plugin rastreado e registra a nova especificação para atualizações futuras.
Passar o nome do pacote sem versão move uma instalação fixada exatamente de volta para
a linha de lançamento padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade do artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou reescrever a configuração.
Quando `openclaw update` é executado no canal beta, registros de plugins npm e ClawHub
da linha padrão tentam `@beta` primeiro e voltam para default/latest quando não existe
lançamento beta do plugin. Versões exatas e tags explícitas permanecem fixadas.

`--pin` é somente para npm. Ele não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner interno de código perigoso. Ela permite que instalações
e atualizações de plugins continuem apesar de achados `critical` internos, mas ainda
não contorna bloqueios de política `before_install` de plugins nem bloqueios por falha de varredura.
As varreduras de instalação ignoram arquivos e diretórios de teste comuns, como `tests/`,
`__tests__/`, `*.test.*` e `*.spec.*`, para evitar o bloqueio de mocks de teste empacotados;
entrypoints de runtime de plugin declarados ainda são verificados mesmo se usarem um desses
nomes.

Essa flag da CLI se aplica apenas a fluxos de instalação/atualização de plugins. Instalações de
dependências de Skills apoiadas pelo Gateway usam a substituição correspondente de solicitação
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` permanece o fluxo separado
de download/instalação de Skills do ClawHub.

Se um plugin que você publicou no ClawHub estiver oculto ou bloqueado por uma varredura, abra o
painel do ClawHub ou execute `clawhub package rescan <name>` para pedir que o ClawHub o verifique
novamente. `--dangerously-force-unsafe-install` afeta apenas instalações na sua própria
máquina; ele não pede que o ClawHub refaça a varredura do plugin nem torna pública uma versão
bloqueada.

Pacotes compatíveis participam do mesmo fluxo de listar/inspecionar/habilitar/desabilitar
plugins. O suporte de runtime atual inclui Skills de pacote, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude e de
`lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hooks
compatíveis do Codex.

`openclaw plugins inspect <id>` também informa as capacidades de pacote detectadas, além de
entradas de servidor MCP e LSP compatíveis ou incompatíveis para plugins baseados em pacotes.

Origens de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou caminho
`marketplace.json`, um atalho do GitHub como `owner/repo`, uma URL de repositório do GitHub
ou uma URL git. Para marketplaces remotos, as entradas de plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas origens por caminho relativo.

Veja a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

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

| Modo            | Significado                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação de runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ativos.                 |
| `discovery`     | Descoberta de capacidades somente leitura. Registre provedores e metadados; código confiável de entrada de plugin pode carregar, mas ignore efeitos colaterais ativos. |
| `setup-only`    | Carregamento de metadados de configuração de canal por uma entrada de configuração leve.                                        |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                  |
| `cli-metadata`  | Somente coleta de metadados de comandos da CLI.                                                                                 |

Entradas de plugin que abrem sockets, bancos de dados, workers em segundo plano ou clientes
de longa duração devem proteger esses efeitos colaterais com `api.registrationMode === "full"`.
Carregamentos de descoberta são armazenados em cache separadamente dos carregamentos de ativação e não substituem
o registro Gateway em execução. A descoberta não ativa, mas não é livre de importação:
o OpenClaw pode avaliar a entrada confiável do plugin ou o módulo de plugin de canal para criar
o snapshot. Mantenha os níveis superiores dos módulos leves e sem efeitos colaterais, e mova
clientes de rede, subprocessos, listeners, leituras de credenciais e inicialização de serviços
para trás dos caminhos de runtime completo.

Métodos comuns de registro:

| Método                                  | O que registra                         |
| --------------------------------------- | -------------------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)               |
| `registerChannel`                       | Canal de chat                          |
| `registerTool`                          | Ferramenta de agente                   |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida                 |
| `registerSpeechProvider`                | Texto para fala / STT                  |
| `registerRealtimeTranscriptionProvider` | STT em streaming                       |
| `registerRealtimeVoiceProvider`         | Voz em tempo real duplex               |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio                |
| `registerImageGenerationProvider`       | Geração de imagens                     |
| `registerMusicGenerationProvider`       | Geração de música                      |
| `registerVideoGenerationProvider`       | Geração de vídeo                       |
| `registerWebFetchProvider`              | Provedor de busca/captura na Web       |
| `registerWebSearchProvider`             | Pesquisa na Web                        |
| `registerHttpRoute`                     | Endpoint HTTP                          |
| `registerCommand` / `registerCli`       | Comandos da CLI                        |
| `registerContextEngine`                 | Mecanismo de contexto                  |
| `registerService`                       | Serviço em segundo plano               |

Comportamento de proteção de hooks para hooks de ciclo de vida tipados:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade menor são ignorados.
- `before_tool_call`: `{ block: false }` é uma operação nula e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade menor são ignorados.
- `before_install`: `{ block: false }` é uma operação nula e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade menor são ignorados.
- `message_sending`: `{ cancel: false }` é uma operação nula e não limpa um cancelamento anterior.

As execuções nativas do Codex app-server fazem a ponte dos eventos de ferramentas nativas do Codex de volta para esta superfície de hooks. Plugins podem bloquear ferramentas nativas do Codex por meio de `before_tool_call`, observar resultados por meio de `after_tool_call` e participar das aprovações `PermissionRequest` do Codex. A ponte ainda não reescreve os argumentos de ferramentas nativas do Codex. O limite exato de suporte ao runtime do Codex está no [contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

Para o comportamento completo de hooks tipados, consulte a [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Criar plugins](/pt-BR/plugins/building-plugins) - crie seu próprio plugin
- [Bundles de Plugin](/pt-BR/plugins/bundles) - compatibilidade de bundles do Codex/Claude/Cursor
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - esquema do manifesto
- [Registrar ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) - adicione ferramentas de agente em um plugin
- [Arquitetura interna do Plugin](/pt-BR/plugins/architecture) - modelo de capacidades e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) - listagens de terceiros
