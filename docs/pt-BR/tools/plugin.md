---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de plugins
    - Trabalhando com pacotes de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar e gerenciar plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:39:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b36ac0e71c95a1f5e3cf9edb1aa7175c04482c25dca72bbf12ad10bef17699c1
    source_path: tools/plugin.md
    workflow: 15
---

Plugins ampliam o OpenClaw com novos recursos: canais, provedores de modelo,
harnesses de agente, ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
entendimento de mídia, geração de imagem, geração de vídeo, busca na web, pesquisa na web
e muito mais. Alguns plugins são **core** (distribuídos com o OpenClaw), outros
são **externos** (publicados no npm pela comunidade).

## Início rápido

<Steps>
  <Step title="Veja o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instale um plugin">
    ```bash
    # Do npm
    openclaw plugins install @openclaw/voice-call

    # De um diretório local ou arquivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Depois, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>` explícito ou
especificação simples de pacote (ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma fechada e aponta para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de plugin empacotado para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam ansiosamente toda a árvore de dependências
de runtime de cada plugin empacotado. Quando um plugin empacotado do OpenClaw está ativo a partir da
configuração de plugin, configuração legada de canal ou um manifesto habilitado por padrão,
a inicialização repara apenas as dependências de runtime declaradas desse plugin antes de importá-lo.
Somente o estado persistido de autenticação do canal não ativa um canal empacotado para reparo
de dependências de runtime na inicialização do Gateway.
A desativação explícita ainda prevalece: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impedem o reparo automático de dependências de runtime empacotadas para esse plugin/canal.
Um `plugins.allow` não vazio também limita o reparo de dependências de runtime empacotadas
habilitadas por padrão; a habilitação explícita de canal empacotado (`channels.<id>.enabled: true`) ainda pode
reparar as dependências de plugin desse canal.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por meio de
`openclaw plugins install`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                   | Exemplos                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Veja [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um plugin nativo, comece com [Building Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Pontos de entrada de pacote

Pacotes npm de plugin nativo devem declarar `openclaw.extensions` em `package.json`.
Cada entrada deve permanecer dentro do diretório do pacote e resolver para um
arquivo de runtime legível, ou para um arquivo-fonte TypeScript com um par JavaScript
compilado inferido, como `src/index.ts` para `dist/index.js`.

Use `openclaw.runtimeExtensions` quando os arquivos de runtime publicados não estiverem
nos mesmos caminhos das entradas de origem. Quando presente, `runtimeExtensions` deve conter
exatamente uma entrada para cada entrada em `extensions`. Listas divergentes fazem a instalação e
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

### Instaláveis (npm)

| Plugin          | Pacote                 | Documentação                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/pt-BR/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/pt-BR/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/pt-BR/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/pt-BR/plugins/zalouser)   |

### Core (distribuídos com o OpenClaw)

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
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda, recuperação/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de navegador empacotado para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço de controle de navegador padrão (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — bridge do VS Code Copilot Proxy (desabilitado por padrão)
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
| `enabled`        | Chave mestre (padrão: `true`)                             |
| `allow`          | Lista de permissões de plugins (opcional)                 |
| `deny`           | Lista de bloqueio de plugins (opcional; deny prevalece)   |
| `load.paths`     | Arquivos/diretórios extras de plugin                      |
| `slots`          | Seletores de slot exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por plugin                    |

Alterações de configuração **exigem reinicialização do gateway**. Se o Gateway estiver executando com
watch de configuração + reinicialização no processo habilitados (o caminho padrão `openclaw gateway`),
essa reinicialização geralmente é realizada automaticamente pouco depois de a gravação da configuração ocorrer.
Não há caminho compatível de hot reload para código de runtime de plugin nativo nem para hooks
de ciclo de vida; reinicie o processo Gateway que atende o canal ativo antes de
esperar que código atualizado de `register(api)`, hooks `api.on(...)`, ferramentas, serviços ou
hooks de provedor/runtime sejam executados.

`openclaw plugins list` é um snapshot local do registro/configuração de plugins. Um
plugin `enabled` ali significa que o registro persistido e a configuração atual permitem que o
plugin participe. Isso não prova que um processo filho remoto do Gateway já em execução
tenha reiniciado com o mesmo código de plugin. Em configurações de VPS/container com
processos wrapper, envie reinicializações ao processo real `openclaw gateway run`,
ou use `openclaw gateway restart` contra o Gateway em execução.

<Accordion title="Estados do plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o plugin existe, mas as regras de habilitação o desativaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao esquema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (a primeira correspondência prevalece):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório. Caminhos que apontam
    de volta para os próprios diretórios empacotados de plugins do OpenClaw são ignorados;
    execute `openclaw doctor --fix` para remover esses aliases obsoletos.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins empacotados">
    Distribuídos com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

Instalações empacotadas e imagens Docker normalmente resolvem plugins empacotados a partir da
árvore compilada `dist/extensions`. Se um diretório-fonte de plugin empacotado for
montado por bind sobre o caminho-fonte empacotado correspondente, por exemplo
`/app/extensions/synology-chat`, o OpenClaw trata esse diretório-fonte montado
como uma sobreposição de origem empacotada e o descobre antes do bundle empacotado
`/app/dist/extensions/synology-chat`. Isso mantém loops de container de mantenedor
funcionando sem trocar todos os plugins empacotados de volta para fonte TypeScript.
Defina `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` para forçar bundles dist empacotados
mesmo quando montagens de sobreposição de origem estiverem presentes.

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse plugin
- Plugins originados do workspace ficam **desabilitados por padrão** (devem ser explicitamente habilitados)
- Plugins empacotados seguem o conjunto interno habilitado por padrão, salvo substituição
- Slots exclusivos podem forçar a habilitação do plugin selecionado para esse slot
- Alguns plugins empacotados opcionais são habilitados automaticamente quando a configuração nomeia uma
  superfície de propriedade do plugin, como uma referência de modelo de provedor, configuração de canal ou
  runtime de harness
- Rotas Codex da família OpenAI mantêm limites de plugin separados:
  `openai-codex/*` pertence ao plugin OpenAI, enquanto o plugin empacotado do servidor do app Codex
  é selecionado por `agentRuntime.id: "codex"` ou referências legadas de modelo `codex/*`

## Troubleshooting de hooks de runtime

Se um plugin aparecer em `plugins list`, mas os efeitos colaterais ou hooks de `register(api)`
não forem executados no tráfego de chat ao vivo, verifique isto primeiro:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a
  URL, perfil, caminho de configuração e processo ativos do Gateway são os que você está editando.
- Reinicie o Gateway ativo após alterações de instalação/configuração/código de plugin. Em
  containers com wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou envie sinal ao processo filho
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --json` para confirmar registros de hooks e
  diagnósticos. Hooks de conversa não empacotados como
  `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end` precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da
  resolução do modelo para interações do agente; `llm_output` só é executado depois que uma tentativa de modelo
  produz saída do assistant.
- Para comprovar o modelo efetivo da sessão, use `openclaw sessions` ou as
  superfícies de sessão/status do Gateway e, ao depurar payloads do provedor, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

### Propriedade duplicada de canal ou ferramenta

Sintomas:

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Isso significa que mais de um plugin habilitado está tentando assumir o mesmo canal,
fluxo de configuração ou nome de ferramenta. A causa mais comum é um plugin externo de canal
instalado ao lado de um plugin empacotado que agora fornece o mesmo id de canal.

Etapas de depuração:

- Execute `openclaw plugins list --enabled --verbose` para ver cada plugin habilitado
  e sua origem.
- Execute `openclaw plugins inspect <id> --json` para cada plugin suspeito e
  compare `channels`, `channelConfigs`, `tools` e diagnósticos.
- Execute `openclaw plugins registry --refresh` após instalar ou remover
  pacotes de plugin para que os metadados persistidos reflitam a instalação atual.
- Reinicie o Gateway após alterações de instalação, registro ou configuração.

Opções de correção:

- Se um plugin substituir intencionalmente outro para o mesmo id de canal, o
  plugin preferido deve declarar `channelConfigs.<channel-id>.preferOver` com
  o id do plugin de menor prioridade. Veja [/plugins/manifest#replacing-another-channel-plugin](/pt-BR/plugins/manifest#replacing-another-channel-plugin).
- Se a duplicidade for acidental, desabilite um dos lados com
  `plugins.entries.<plugin-id>.enabled: false` ou remova a instalação obsoleta do plugin.
- Se você habilitou explicitamente ambos os plugins, o OpenClaw mantém essa solicitação e
  relata o conflito. Escolha um único responsável pelo canal ou renomeie
  ferramentas de propriedade do plugin para que a superfície de runtime fique inequívoca.

## Slots de plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desabilitar
      contextEngine: "legacy", // ou um id de plugin
    },
  },
}
```

| Slot            | O que controla             | Padrão              |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin de memória ativo    | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (integrado) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins habilitados
openclaw plugins list --verbose            # linhas detalhadas por plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos
openclaw plugins registry                  # inspeciona o estado persistido do registro
openclaw plugins registry --refresh        # reconstrói o registro persistido
openclaw doctor --fix                      # repara o estado do registro de plugins

openclaw plugins install <package>         # instala (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instala apenas do ClawHub
openclaw plugins install <spec> --force    # sobrescreve instalação existente
openclaw plugins install <path>            # instala de um caminho local
openclaw plugins install -l <path>         # vincula (sem copiar) para desenvolvimento
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra a especificação npm exata resolvida
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualiza um plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualiza todos
openclaw plugins uninstall <id>          # remove configuração e registros de índice do plugin
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins empacotados são distribuídos com o OpenClaw. Muitos são habilitados por padrão (por exemplo,
provedores de modelo empacotados, provedores de fala empacotados e o plugin de navegador
empacotado). Outros plugins empacotados ainda exigem `openclaw plugins enable <id>`.

`--force` sobrescreve no local um plugin ou pacote de hooks já instalado. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de plugins npm
rastreados. Isso não é compatível com `--link`, que reutiliza o caminho-fonte em vez
de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa lista de permissões antes de habilitá-lo. Se o mesmo id de plugin
estiver presente em `plugins.deny`, a instalação remove essa entrada deny obsoleta para que o
plugin explicitamente instalado possa ser carregado imediatamente após a reinicialização.

O OpenClaw mantém um registro local persistido de plugins como modelo de leitura a frio para
inventário de plugins, propriedade de contribuições e planejamento de inicialização. Fluxos de instalação, atualização,
desinstalação, habilitação e desabilitação atualizam esse registro após mudar o estado do plugin.
O mesmo arquivo `plugins/installs.json` mantém metadados duráveis de instalação em
`installRecords` de nível superior e metadados de manifesto reconstruíveis em `plugins`. Se
o registro estiver ausente, obsoleto ou inválido, `openclaw plugins registry
--refresh` reconstrói sua visão de manifesto a partir de registros de instalação, política de configuração e
metadados de manifesto/pacote sem carregar módulos de runtime de plugin.
`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta ao registro rastreado do plugin e registra a nova especificação para futuras atualizações.
Passar o nome do pacote sem versão move uma instalação fixada exatamente de volta para
a linha de release padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou regravar a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações via marketplace persistem metadados de origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner integrado de código perigoso. Ele permite que instalações
e atualizações de plugins prossigam apesar de achados integrados `critical`, mas ainda
não ignora bloqueios de política `before_install` do plugin nem bloqueio por falha de varredura.

Essa flag da CLI se aplica apenas a fluxos de instalação/atualização de plugin. Instalações de dependências
de Skills com suporte do Gateway usam, em vez disso, a substituição de solicitação correspondente `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skill do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de plugins.
O suporte atual de runtime inclui Skills de bundle, command-skills do Claude,
padrões do Claude `settings.json`, padrões do Claude `.lsp.json` e `lspServers`
declarados no manifesto, command-skills do Cursor e diretórios de hooks compatíveis do Codex.

`openclaw plugins inspect <id>` também relata capacidades de bundle detectadas, além de
entradas MCP e de servidor LSP compatíveis ou incompatíveis para plugins baseados em bundle.

As origens de marketplace podem ser um nome de marketplace conhecido do Claude de
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou caminho
`marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub
ou uma URL git. Para marketplaces remotos, entradas de plugin devem permanecer dentro do
repositório clonado do marketplace e usar apenas origens de caminho relativas.

Veja a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de plugin

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins mais antigos
ainda podem usar `activate(api)` como alias legado, mas plugins novos devem
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
mas plugins empacotados e novos plugins externos devem tratar `register` como o contrato público.

`api.registrationMode` informa a um plugin por que sua entrada está sendo carregada:

| Modo            | Significado                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação de runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ao vivo.                  |
| `discovery`     | Descoberta somente leitura de capacidades. Registre provedores e metadados; código de entrada de plugin confiável pode carregar, mas deve ignorar efeitos colaterais ao vivo. |
| `setup-only`    | Carregamento de metadados de configuração de canal por meio de uma entrada leve de setup.                                          |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                     |
| `cli-metadata`  | Apenas coleta de metadados de comandos da CLI.                                                                                     |

Entradas de plugin que abrem sockets, bancos de dados, workers em segundo plano ou clientes
de longa duração devem proteger esses efeitos colaterais com `api.registrationMode === "full"`.
Carregamentos de descoberta são armazenados em cache separadamente dos carregamentos de ativação
e não substituem o registro do Gateway em execução. Descoberta não ativa, mas também não é livre de importação:
o OpenClaw pode avaliar a entrada do plugin confiável ou o módulo do plugin de canal para montar
o snapshot. Mantenha os níveis superiores do módulo leves e sem efeitos colaterais, e mova
clientes de rede, subprocessos, listeners, leituras de credenciais e inicialização de serviços
para caminhos de runtime completo.

Métodos comuns de registro:

| Method                                  | O que registra             |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)   |
| `registerChannel`                       | Canal de chat              |
| `registerTool`                          | Ferramenta do agente       |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida     |
| `registerSpeechProvider`                | Texto para fala / STT      |
| `registerRealtimeTranscriptionProvider` | STT por streaming          |
| `registerRealtimeVoiceProvider`         | Voz bidirecional em tempo real |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio    |
| `registerImageGenerationProvider`       | Geração de imagem          |
| `registerMusicGenerationProvider`       | Geração de música          |
| `registerVideoGenerationProvider`       | Geração de vídeo           |
| `registerWebFetchProvider`              | Provedor de busca/coleta na web |
| `registerWebSearchProvider`             | Pesquisa na web            |
| `registerHttpRoute`                     | Endpoint HTTP              |
| `registerCommand` / `registerCli`       | Comandos da CLI            |
| `registerContextEngine`                 | Mecanismo de contexto      |
| `registerService`                       | Serviço em segundo plano   |

Comportamento de guarda de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade menor são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não remove um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade menor são ignorados.
- `before_install`: `{ block: false }` não faz nada e não remove um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade menor são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não remove um cancelamento anterior.

Execuções nativas do app-server Codex fazem a ponte de eventos de ferramenta nativos do Codex de volta para esta
superfície de hook. Plugins podem bloquear ferramentas nativas do Codex por meio de `before_tool_call`,
observar resultados por meio de `after_tool_call` e participar das aprovações de
`PermissionRequest` do Codex. A ponte ainda não reescreve argumentos de ferramentas nativas do Codex. O limite exato de suporte do runtime Codex está no
[contrato de suporte do harness Codex v1](/pt-BR/plugins/codex-harness#v1-support-contract).

Para o comportamento completo de hooks tipados, veja [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Building plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin bundles](/pt-BR/plugins/bundles) — compatibilidade de bundles Codex/Claude/Cursor
- [Manifesto do plugin](/pt-BR/plugins/manifest) — esquema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um plugin
- [Internos de plugin](/pt-BR/plugins/architecture) — modelo de capacidades e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
