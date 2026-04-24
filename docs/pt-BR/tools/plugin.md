---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de plugins
    - Trabalhando com pacotes de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T15:21:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 947bb7ffc13280fd63f79bb68cb18a37c6614144b91a83afd38e5ac3c5187aed
    source_path: tools/plugin.md
    workflow: 15
---

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
harnesses de agente, ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
compreensão de mídia, geração de imagem, geração de vídeo, busca na web, pesquisa na web
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

    Em seguida, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se você preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>` explícito ou especificação de pacote simples (ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma segura e direciona você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de plugin empacotado para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.

As instalações empacotadas do OpenClaw não instalam de forma antecipada toda a
árvore de dependências de tempo de execução de cada plugin empacotado. Quando um
plugin empacotado de propriedade do OpenClaw está ativo a partir da configuração de plugin,
configuração legada de canal ou um manifesto habilitado por padrão, a inicialização
repara apenas as dependências de tempo de execução declaradas desse plugin antes de importá-lo.
Plugins externos e caminhos de carregamento personalizados ainda devem ser instalados por meio de
`openclaw plugins install`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato   | Como funciona                                                   | Exemplos                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de tempo de execução; executa no processo       | Plugins oficiais, pacotes npm da comunidade               |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles de plugin.

Se você estiver escrevendo um plugin nativo, comece com [Building Plugins](/pt-BR/plugins/building-plugins)
e a [Plugin SDK Overview](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                | Docs                                 |
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
    - `browser` — plugin de navegador empacotado para a ferramenta de navegador, CLI `openclaw browser`, método Gateway `browser.request`, runtime de navegador e serviço padrão de controle do navegador (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — ponte VS Code Copilot Proxy (desabilitado por padrão)
  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Consulte [Community Plugins](/pt-BR/plugins/community).

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
| `enabled`        | Alternância principal (padrão: `true`)                           |
| `allow`          | Lista de permissão de plugins (opcional)                               |
| `deny`           | Lista de bloqueio de plugins (opcional; o bloqueio prevalece)                     |
| `load.paths`     | Arquivos/diretórios extras de plugin                            |
| `slots`          | Seletores de slot exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por plugin                               |

As alterações de configuração **exigem reinicialização do Gateway**. Se o Gateway estiver em execução com
observação de configuração + reinicialização no processo habilitadas (o caminho padrão de `openclaw gateway`),
essa reinicialização geralmente é realizada automaticamente um instante após a gravação da configuração.
Não há caminho compatível de hot reload para código de runtime nativo de plugin nem hooks de ciclo de vida;
reinicie o processo Gateway que está atendendo o canal ativo antes de
esperar que código `register(api)` atualizado, hooks `api.on(...)`, ferramentas, serviços ou
hooks de provedor/runtime sejam executados.

`openclaw plugins list` é um snapshot local da CLI/configuração. Um plugin `loaded` ali
significa que o plugin é detectável e carregável a partir da configuração/arquivos vistos por aquela
invocação da CLI. Isso não prova que um processo filho remoto do Gateway já em execução
foi reiniciado para usar o mesmo código de plugin. Em configurações de VPS/container com processos
wrapper, envie reinicializações para o processo real `openclaw gateway run` ou use
`openclaw gateway restart` contra o Gateway em execução.

<Accordion title="Estados do plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o plugin existe, mas as regras de habilitação o desativaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (a primeira correspondência prevalece):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório.
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

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse plugin
- Plugins originados do workspace são **desabilitados por padrão** (devem ser explicitamente habilitados)
- Plugins empacotados seguem o conjunto interno habilitado por padrão, a menos que sejam sobrescritos
- Slots exclusivos podem forçar a habilitação do plugin selecionado para esse slot
- Alguns plugins empacotados opcionais são habilitados automaticamente quando a configuração nomeia uma
  superfície pertencente ao plugin, como uma referência de modelo do provedor, configuração de canal ou
  runtime de harness
- Rotas Codex da família OpenAI mantêm limites de plugin separados:
  `openai-codex/*` pertence ao plugin OpenAI, enquanto o plugin empacotado de
  servidor de app Codex é selecionado por `embeddedHarness.runtime: "codex"` ou referências
  legadas de modelo `codex/*`

## Solução de problemas de hooks de runtime

Se um plugin aparecer em `plugins list`, mas efeitos colaterais ou hooks de `register(api)`
não forem executados no tráfego de chat ativo, verifique primeiro o seguinte:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a URL,
  perfil, caminho de configuração e processo do Gateway ativo são os que você está editando.
- Reinicie o Gateway ativo após alterações de instalação/configuração/código do plugin. Em
  containers wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou envie sinal ao processo filho
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --json` para confirmar registros de hook e
  diagnósticos. Hooks de conversa não empacotados, como `llm_input`,
  `llm_output` e `agent_end`, precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da resolução
  do modelo para turnos do agente; `llm_output` só é executado depois que uma tentativa de modelo
  produz saída do assistente.
- Para comprovar o modelo efetivo da sessão, use `openclaw sessions` ou as
  superfícies de sessão/status do Gateway e, ao depurar payloads do provedor, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

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

| Slot            | O que controla      | Padrão             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memória ativo  | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (interno) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins carregados
openclaw plugins list --verbose            # linhas detalhadas por plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instala (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instala apenas do ClawHub
openclaw plugins install <spec> --force    # sobrescreve instalação existente
openclaw plugins install <path>            # instala de um caminho local
openclaw plugins install -l <path>         # vincula (sem copiar) para desenvolvimento
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra a especificação npm resolvida exata
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualiza um plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualiza todos
openclaw plugins uninstall <id>          # remove registros de configuração/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins empacotados são distribuídos com o OpenClaw. Muitos são habilitados por padrão (por exemplo,
provedores de modelo empacotados, provedores de fala empacotados e o plugin
de navegador empacotado). Outros plugins empacotados ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado existente ou pacote de hooks no lugar. Use
`openclaw plugins update <id-or-npm-spec>` para atualizações rotineiras de plugins npm
rastreados. Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez
de copiar para um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa lista de permissão antes de habilitá-lo, para que as instalações
possam ser carregadas imediatamente após a reinicialização.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro de plugin rastreado e grava a nova especificação para atualizações futuras.
Passar o nome do pacote sem uma versão move uma instalação fixada com versão exata de volta para
a linha de versão padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade do artefato registrada, o OpenClaw ignorará a atualização
sem baixar, reinstalar ou regravar a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações via marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner interno de código perigoso. Ele permite que instalações e
atualizações de plugins continuem além de achados internos `critical`, mas ainda
não ignora bloqueios de política `before_install` do plugin nem o bloqueio por falha de varredura.

Essa flag da CLI se aplica apenas a fluxos de instalação/atualização de plugins. Instalações de
dependências de Skills com suporte do Gateway usam a substituição de requisição correspondente
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado
de download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de listar/inspecionar/habilitar/desabilitar plugins.
O suporte atual de runtime inclui Skills de bundle, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude e `lspServers`
declarados no manifesto, command-skills do Cursor e diretórios de hooks
compatíveis do Codex.

`openclaw plugins inspect <id>` também informa recursos de bundle detectados, além de
entradas de servidor MCP e LSP suportadas ou não suportadas para plugins baseados em bundle.

As origens de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou caminho
`marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub
ou uma URL git. Para marketplaces remotos, as entradas de plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas origens de caminho relativas.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de plugins

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins
mais antigos ainda podem usar `activate(api)` como alias legado, mas plugins novos devem
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
ativação do plugin. O carregador ainda usa `activate(api)` como fallback para plugins
mais antigos, mas plugins empacotados e novos plugins externos devem tratar `register` como o
contrato público.

Métodos comuns de registro:

| Método                                  | O que ele registra         |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)   |
| `registerChannel`                       | Canal de chat              |
| `registerTool`                          | Ferramenta de agente       |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida     |
| `registerSpeechProvider`                | Text-to-speech / STT       |
| `registerRealtimeTranscriptionProvider` | STT por streaming          |
| `registerRealtimeVoiceProvider`         | Voz duplex em tempo real   |
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

Comportamento de guarda de hooks para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade inferior são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade inferior são ignorados.
- `before_install`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade inferior são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não limpa um cancelamento anterior.

Para o comportamento completo dos hooks tipados, consulte [SDK Overview](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Building Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade de bundles Codex/Claude/Cursor
- [Plugin Manifest](/pt-BR/plugins/manifest) — schema do manifesto
- [Registering Tools](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um plugin
- [Plugin Internals](/pt-BR/plugins/architecture) — modelo de capacidades e pipeline de carregamento
- [Community Plugins](/pt-BR/plugins/community) — listagens de terceiros
