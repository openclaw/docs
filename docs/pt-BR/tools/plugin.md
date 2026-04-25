---
read_when:
    - Instalando ou configurando Plugins
    - Entendendo as regras de descoberta e carregamento de Plugins
    - Trabalhando com bundles de Plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie Plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T13:57:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54a902eabd90e54e769429770cd56e1d89a8bb50aff4b9ed8a9f68d6685b77a8
    source_path: tools/plugin.md
    workflow: 15
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
harnesses de agente, ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
compreensão de mídia, geração de imagens, geração de vídeo, busca na web, pesquisa na web
e muito mais. Alguns Plugins são **core** (enviados com o OpenClaw), outros
são **externos** (publicados no npm pela comunidade).

## Início rápido

<Steps>
  <Step title="Ver o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instalar um Plugin">
    ```bash
    # Do npm
    openclaw plugins install @openclaw/voice-call

    # De um diretório ou arquivo local
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reiniciar o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Depois, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se você preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>`
explícito ou especificação simples de pacote (ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma fechada e aponta você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de Plugin incluído para Plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam antecipadamente toda a
árvore de dependências de runtime de cada Plugin incluído. Quando um Plugin incluído de propriedade do OpenClaw está ativo a partir da
configuração de Plugin, configuração legada de canal ou um manifesto habilitado por padrão, a inicialização
repara apenas as dependências de runtime declaradas desse Plugin antes de importá-lo.
A desativação explícita continua prevalecendo: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impedem o reparo automático de dependências de runtime incluídas para esse Plugin/canal.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por
`openclaw plugins install`.

## Tipos de Plugin

O OpenClaw reconhece dois formatos de Plugin:

| Formato    | Como funciona                                                  | Exemplos                                               |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Bundles de Plugins](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um Plugin nativo, comece por [Criando Plugins](/pt-BR/plugins/building-plugins)
e pela [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                | Docs                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/pt-BR/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/pt-BR/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)   |
| Zalo            | `@openclaw/zalo`      | [Zalo](/pt-BR/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/pt-BR/plugins/zalouser)   |

### Core (enviados com o OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de modelo (habilitados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — pesquisa de memória incluída (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda, autorecall/autocapture (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — Plugin de navegador incluído para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço padrão de controle de navegador (habilitado por padrão; desative antes de substituí-lo)
    - `copilot-proxy` — ponte do VS Code Copilot Proxy (desabilitado por padrão)
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
| `enabled`        | Alternância mestra (padrão: `true`)                       |
| `allow`          | Allowlist de Plugin (opcional)                            |
| `deny`           | Denylist de Plugin (opcional; deny prevalece)             |
| `load.paths`     | Arquivos/diretórios extras de Plugin                      |
| `slots`          | Seletores de slot exclusivos (ex.: `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por Plugin                    |

Alterações de configuração **exigem reinício do gateway**. Se o Gateway estiver em execução com
watch de configuração + reinício no processo habilitados (o caminho padrão `openclaw gateway`),
esse reinício normalmente é feito automaticamente pouco depois de a gravação de configuração ser aplicada.
Não há caminho compatível de hot reload para código de runtime nativo de Plugin nem para hooks de ciclo de vida;
reinicie o processo do Gateway que está atendendo o canal ativo antes de
esperar que código `register(api)` atualizado, hooks `api.on(...)`, ferramentas, serviços ou
hooks de provedor/runtime passem a executar.

`openclaw plugins list` é um snapshot local da CLI/configuração. Um Plugin `loaded` ali
significa que o Plugin é detectável e carregável a partir da configuração/arquivos vistos por aquela
invocação da CLI. Isso não prova que um child remoto do Gateway já em execução
tenha reiniciado com o mesmo código de Plugin. Em setups de VPS/container com processos wrapper,
envie reinicializações ao processo real `openclaw gateway run`, ou use
`openclaw gateway restart` contra o Gateway em execução.

<Accordion title="Estados do Plugin: disabled vs missing vs invalid">
  - **Disabled**: o Plugin existe, mas as regras de habilitação o desativaram. A configuração é preservada.
  - **Missing**: a configuração faz referência a um ID de Plugin que a descoberta não encontrou.
  - **Invalid**: o Plugin existe, mas sua configuração não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw varre Plugins nesta ordem (a primeira correspondência prevalece):

<Steps>
  <Step title="Caminhos da configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório.
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

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os Plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse Plugin
- Plugins originados no workspace ficam **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins incluídos seguem o conjunto interno habilitado por padrão, salvo substituição
- Slots exclusivos podem forçar a habilitação do Plugin selecionado para esse slot
- Alguns Plugins incluídos opcionais são habilitados automaticamente quando a configuração nomeia uma
  superfície pertencente ao Plugin, como uma referência de modelo de provedor, configuração de canal ou runtime de harness
- Rotas Codex da família OpenAI mantêm limites separados de Plugin:
  `openai-codex/*` pertence ao Plugin OpenAI, enquanto o Plugin incluído do servidor de app Codex
  é selecionado por `embeddedHarness.runtime: "codex"` ou referências legadas de modelo `codex/*`

## Solução de problemas com hooks de runtime

Se um Plugin aparecer em `plugins list`, mas efeitos colaterais ou hooks de `register(api)`
não rodarem no tráfego de chat ativo, verifique primeiro:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a
  URL, o perfil, o caminho de configuração e o processo do Gateway ativo são os que você está editando.
- Reinicie o Gateway ativo após alterações de instalação/configuração/código do Plugin. Em
  containers wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou sinalize o processo filho
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --json` para confirmar registros de hooks e
  diagnósticos. Hooks de conversa não incluídos, como `llm_input`,
  `llm_output` e `agent_end`, precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele roda antes da resolução do modelo
  para turnos do agente; `llm_output` só roda depois que uma tentativa de modelo
  produz saída do assistente.
- Para comprovar o modelo efetivo da sessão, use `openclaw sessions` ou as
  superfícies de sessão/status do Gateway e, ao depurar payloads do provedor, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

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

| Slot            | O que controla            | Padrão              |
| --------------- | ------------------------- | ------------------- |
| `memory`        | Plugin de memória ativo   | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (interno) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas Plugins carregados
openclaw plugins list --verbose            # linhas de detalhe por Plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instalar (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instalar somente do ClawHub
openclaw plugins install <spec> --force    # sobrescrever instalação existente
openclaw plugins install <path>            # instalar de caminho local
openclaw plugins install -l <path>         # vincular (sem copiar) para dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar a especificação npm exata resolvida
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualizar um Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualizar todos
openclaw plugins uninstall <id>          # remover registros de config/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Os Plugins incluídos são enviados com o OpenClaw. Muitos são habilitados por padrão (por exemplo,
provedores de modelo incluídos, provedores de fala incluídos e o Plugin de navegador
incluído). Outros Plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve no lugar um Plugin ou pacote de hooks já instalado. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de Plugins npm
rastreados. Não é compatível com `--link`, que reutiliza o caminho de origem em vez
de copiar sobre um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
ID do Plugin instalado a essa allowlist antes de habilitá-lo, para que as instalações sejam
carregáveis imediatamente após o reinício.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta ao registro rastreado do Plugin e registra a nova especificação para futuras atualizações.
Passar o nome do pacote sem versão move uma instalação exata fixada de volta para
a linha de lançamento padrão do registro. Se o Plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar nem reescrever a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações via marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner interno de código perigoso. Ele permite que instalações
e atualizações de Plugin prossigam mesmo com achados internos `critical`, mas ainda
não ignora bloqueios de política `before_install` do Plugin nem bloqueio por falha de varredura.

Essa flag da CLI se aplica apenas aos fluxos de instalação/atualização de Plugin. Instalações de
dependências de Skills com suporte do Gateway usam a substituição equivalente de requisição
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado
de download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de Plugins. O suporte atual de runtime inclui bundle Skills, command-Skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` e `lspServers`
declarados no manifesto do Claude, command-Skills do Cursor e diretórios de hooks
compatíveis do Codex.

`openclaw plugins inspect <id>` também informa os recursos de bundle detectados, além de entradas
de servidor MCP e LSP suportadas ou não suportadas para Plugins baseados em bundle.

Origens de marketplace podem ser um nome de marketplace conhecido do Claude de
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou caminho
`marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. Para marketplaces remotos, as entradas de Plugin devem permanecer dentro do
repositório clonado do marketplace e usar apenas origens de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

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
ativação do Plugin. O carregador ainda recorre a `activate(api)` para Plugins mais antigos,
mas Plugins incluídos e novos Plugins externos devem tratar `register` como o contrato
público.

`api.registrationMode` informa ao Plugin por que sua entrada está sendo carregada:

| Modo            | Significado                                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação de runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ativos.                  |
| `discovery`     | Descoberta de recursos somente leitura. Registre provedores e metadados; código de entrada de Plugin confiável pode carregar, mas ignore efeitos colaterais ativos. |
| `setup-only`    | Carregamento de metadados de configuração de canal por meio de uma entrada leve de configuração.                                  |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                   |
| `cli-metadata`  | Apenas coleta de metadados de comando da CLI.                                                                                     |

Entradas de Plugin que abrem sockets, bancos de dados, workers em segundo plano ou clientes
de longa duração devem proteger esses efeitos colaterais com `api.registrationMode === "full"`.
Carregamentos de descoberta são armazenados em cache separadamente dos carregamentos de ativação e não substituem
o registro do Gateway em execução. Descoberta não ativa, mas também não é livre de importação:
o OpenClaw pode avaliar a entrada do Plugin confiável ou o módulo do Plugin de canal para construir
o snapshot. Mantenha os níveis de topo dos módulos leves e sem efeitos colaterais e mova
clientes de rede, subprocessos, listeners, leituras de credenciais e inicialização de serviços
para trás de caminhos de runtime completo.

Métodos comuns de registro:

| Método                                  | O que registra              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)    |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Ferramenta de agente        |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida      |
| `registerSpeechProvider`                | Conversão de texto em fala / STT |
| `registerRealtimeTranscriptionProvider` | STT em streaming            |
| `registerRealtimeVoiceProvider`         | Voz duplex em tempo real    |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio     |
| `registerImageGenerationProvider`       | Geração de imagens          |
| `registerMusicGenerationProvider`       | Geração de música           |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de busca/scrape na web |
| `registerWebSearchProvider`             | Pesquisa na web             |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos da CLI             |
| `registerContextEngine`                 | Mecanismo de contexto       |
| `registerService`                       | Serviço em segundo plano    |

Comportamento de guard de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_install`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não limpa um cancelamento anterior.

Execuções nativas do servidor de app Codex fazem a ponte de eventos de ferramenta nativos do Codex de volta para essa
superfície de hooks. Plugins podem bloquear ferramentas nativas do Codex por meio de `before_tool_call`,
observar resultados por meio de `after_tool_call` e participar de aprovações de
`PermissionRequest` do Codex. A ponte ainda não reescreve argumentos de ferramenta nativos do Codex. O limite exato de suporte do runtime Codex está no
[contrato de suporte v1 do harness Codex](/pt-BR/plugins/codex-harness#v1-support-contract).

Para o comportamento tipado completo de hooks, consulte [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio Plugin
- [Bundles de Plugins](/pt-BR/plugins/bundles) — compatibilidade com bundles Codex/Claude/Cursor
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um Plugin
- [Detalhes internos de Plugins](/pt-BR/plugins/architecture) — modelo de recursos e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
