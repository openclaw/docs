---
read_when:
    - Instalando ou configurando plugins
    - Entendendo as regras de descoberta e carregamento de plugins
    - Trabalhando com bundles de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar e gerenciar plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:22:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82e272b1b59006b1f40b4acc3f21a8bca8ecacc1a8b7fb577ad3d874b9a8e326
    source_path: tools/plugin.md
    workflow: 15
---

Plugins estendem o OpenClaw com novas capacidades: canais, providers de modelo,
agent harnesses, ferramentas, Skills, fala, transcrição em tempo real, voz em tempo
real, entendimento de mídia, geração de imagem, geração de vídeo, web fetch, busca na web
e mais. Alguns plugins são **core** (enviados com o OpenClaw), outros
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

    # De um diretório local ou arquivo compactado
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
</Steps>

Se você preferir controle nativo por chat, ative `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>`
explícito ou especificação simples de pacote (ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma fechada e aponta você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de plugin empacotado para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam antecipadamente toda a árvore de dependências
de runtime de cada plugin empacotado. Quando um plugin empacotado pertencente ao OpenClaw está ativo por
configuração de plugin, configuração legada de canal ou manifesto ativado por padrão, a inicialização
repara apenas as dependências de runtime declaradas desse plugin antes de importá-lo.
A desativação explícita continua prevalecendo: `plugins.entries.<id>.enabled: false`,
`plugins.deny`, `plugins.enabled: false` e `channels.<id>.enabled: false`
impedem o reparo automático das dependências de runtime empacotadas para esse plugin/canal.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por
`openclaw plugins install`.

## Tipos de Plugin

O OpenClaw reconhece dois formatos de plugin:

| Format     | How it works                                                       | Examples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de runtime; executa no processo    | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um plugin nativo, comece com [Criando Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/pt-BR/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/pt-BR/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/pt-BR/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/pt-BR/plugins/zalouser)   |

### Core (enviados com o OpenClaw)

<AccordionGroup>
  <Accordion title="Providers de modelo (ativados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — busca de memória empacotada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda e recordação/captura automática (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Providers de fala (ativados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de navegador empacotado para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime do navegador e serviço padrão de controle do navegador (ativado por padrão; desative antes de substituí-lo)
    - `copilot-proxy` — bridge do VS Code Copilot Proxy (desativada por padrão)
  </Accordion>
</AccordionGroup>

Está procurando plugins de terceiros? Consulte [Plugins da comunidade](/pt-BR/plugins/community).

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

| Field            | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Alternância principal (padrão: `true`)                    |
| `allow`          | Allowlist de plugins (opcional)                           |
| `deny`           | Denylist de plugins (opcional; deny prevalece)            |
| `load.paths`     | Arquivos/diretórios extras de plugin                      |
| `slots`          | Seletores de slot exclusivos (por exemplo `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por plugin                    |

Mudanças de configuração **exigem reinicialização do gateway**. Se o Gateway estiver executando com
watch de configuração + reinicialização no processo ativados (o caminho padrão `openclaw gateway`), essa
reinicialização normalmente é feita automaticamente pouco depois de a gravação da configuração ocorrer.
Não há caminho compatível de hot-reload para código de runtime nativo de plugin nem para hooks
de ciclo de vida; reinicie o processo do Gateway que está atendendo o canal ao vivo antes de
esperar que código `register(api)` atualizado, hooks `api.on(...)`, ferramentas, serviços ou
hooks de provider/runtime sejam executados.

`openclaw plugins list` é um snapshot local de registro/configuração de plugins. Um
plugin `enabled` ali significa que o registro persistido e a configuração atual permitem que o
plugin participe. Isso não prova que um child remoto do Gateway já em execução
foi reiniciado com o mesmo código do plugin. Em configurações com VPS/container com
processos wrapper, envie reinicializações para o processo real `openclaw gateway run`,
ou use `openclaw gateway restart` contra o Gateway em execução.

<Accordion title="Estados do Plugin: disabled vs missing vs invalid">
  - **Disabled**: o plugin existe, mas as regras de ativação o desligaram. A configuração é preservada.
  - **Missing**: a configuração referencia um id de plugin que a descoberta não encontrou.
  - **Invalid**: o plugin existe, mas sua configuração não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw examina plugins nesta ordem (a primeira correspondência prevalece):

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
    Enviados com o OpenClaw. Muitos são ativados por padrão (providers de modelo, fala).
    Outros exigem ativação explícita.
  </Step>
</Steps>

### Regras de ativação

- `plugins.enabled: false` desativa todos os plugins
- `plugins.deny` sempre prevalece sobre allow
- `plugins.entries.\<id\>.enabled: false` desativa esse plugin
- Plugins originados do workspace são **desativados por padrão** (precisam ser ativados explicitamente)
- Plugins empacotados seguem o conjunto embutido ativado por padrão, a menos que sejam sobrescritos
- Slots exclusivos podem forçar a ativação do plugin selecionado para esse slot
- Alguns plugins empacotados opt-in são ativados automaticamente quando a configuração nomeia uma
  superfície de propriedade do plugin, como uma referência de modelo de provider, configuração de canal ou
  runtime de harness
- Rotas Codex da família OpenAI mantêm limites de plugin separados:
  `openai-codex/*` pertence ao plugin OpenAI, enquanto o plugin empacotado de
  app-server Codex é selecionado por `embeddedHarness.runtime: "codex"` ou por
  referências legadas de modelo `codex/*`

## Solução de problemas com hooks de runtime

Se um plugin aparecer em `plugins list`, mas os efeitos colaterais ou hooks de `register(api)`
não forem executados no tráfego ao vivo do chat, verifique primeiro estes pontos:

- Execute `openclaw gateway status --deep --require-rpc` e confirme que a
  URL, perfil, caminho de configuração e processo do Gateway ativos são os que você está editando.
- Reinicie o Gateway ao vivo após alterações de instalação/configuração/código do plugin. Em
  containers wrapper, o PID 1 pode ser apenas um supervisor; reinicie ou sinalize o processo child
  `openclaw gateway run`.
- Use `openclaw plugins inspect <id> --json` para confirmar registros de hooks e
  diagnósticos. Hooks de conversa não empacotados, como `llm_input`,
  `llm_output` e `agent_end`, precisam de
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Para troca de modelo, prefira `before_model_resolve`. Ele é executado antes da resolução
  de modelo para turnos de agent; `llm_output` só é executado depois que uma tentativa de modelo
  produz saída do assistant.
- Para prova do modelo efetivo da sessão, use `openclaw sessions` ou as
  superfícies de sessão/status do Gateway e, ao depurar payloads do provider, inicie
  o Gateway com `--raw-stream --raw-stream-path <path>`.

## Slots de Plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desativar
      contextEngine: "legacy", // ou um id de plugin
    },
  },
}
```

| Slot            | What it controls      | Default             |
| --------------- | --------------------- | ------------------- |
| `memory`        | Plugin de memória ativo | `memory-core`     |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (embutido) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins ativados
openclaw plugins list --verbose            # linhas de detalhe por plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos
openclaw plugins registry                  # inspeciona o estado persistido do registro
openclaw plugins registry --refresh        # reconstrói o registro persistido

openclaw plugins install <package>         # instala (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instala apenas do ClawHub
openclaw plugins install <spec> --force    # sobrescreve uma instalação existente
openclaw plugins install <path>            # instala de um caminho local
openclaw plugins install -l <path>         # linka (sem copiar) para desenvolvimento
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra a especificação npm exata resolvida
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

Plugins empacotados são enviados com o OpenClaw. Muitos são ativados por padrão (por exemplo,
providers de modelo empacotados, providers de fala empacotados e o plugin de navegador
empacotado). Outros plugins empacotados ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin ou hook pack instalado existente no local. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades rotineiros de plugins npm
rastreados. Não é compatível com `--link`, que reutiliza o caminho de origem em vez
de copiar para um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa allowlist antes de ativá-lo, para que instalações
possam ser carregadas imediatamente após a reinicialização.

O OpenClaw mantém um registro local persistido de plugins como modelo de leitura fria para
inventário de plugins, propriedade de contribuições e planejamento de inicialização. Fluxos de instalar, atualizar,
desinstalar, ativar e desativar atualizam esse registro após alterar o
estado do plugin. Se o registro estiver ausente, desatualizado ou inválido, `openclaw plugins registry
--refresh` o reconstrói a partir do ledger de instalação durável, política de configuração e
metadados de manifesto/pacote, sem carregar módulos de runtime de plugin.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro rastreado do plugin e grava a nova especificação para atualizações futuras.
Passar o nome do pacote sem versão move uma instalação exata fixada de volta para
a linha de release padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw pula a atualização
sem baixar, reinstalar ou regravar a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner embutido de código perigoso. Ele permite que instalações
e atualizações de plugins prossigam apesar de achados embutidos `critical`, mas ainda
não ignora bloqueios de política `before_install` de plugin nem bloqueios por falha de varredura.

Esse sinalizador da CLI se aplica apenas a fluxos de instalação/atualização de plugin. Instalações de dependência
de Skills com suporte do Gateway usam a substituição correspondente de solicitação `dangerouslyForceUnsafeInstall`,
enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skills pelo ClawHub.

Bundles compatíveis participam do mesmo fluxo de listar/inspecionar/ativar/desativar plugins.
O suporte atual de runtime inclui Skills de bundle, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `lspServers` do Claude `.lsp.json` e declarados em manifesto,
command-skills do Cursor e diretórios de hook Codex compatíveis.

`openclaw plugins inspect <id>` também relata capacidades de bundle detectadas mais
entradas de servidor MCP e LSP compatíveis ou não compatíveis para plugins baseados em bundle.

Origens de marketplace podem ser um nome conhecido de marketplace do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou caminho
`marketplace.json`, uma forma curta do GitHub como `owner/repo`, uma URL de repositório
do GitHub ou uma URL git. Para marketplaces remotos, as entradas de plugin precisam permanecer dentro do
repositório clonado do marketplace e usar apenas origens de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de Plugin

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
ativação do plugin. O loader ainda usa `activate(api)` como fallback para plugins mais antigos,
mas plugins empacotados e novos plugins externos devem tratar `register` como o contrato público.

`api.registrationMode` informa a um plugin por que sua entrada está sendo carregada:

| Mode            | Meaning                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Ativação de runtime. Registre ferramentas, hooks, serviços, comandos, rotas e outros efeitos colaterais ao vivo.              |
| `discovery`     | Descoberta de capacidades somente leitura. Registre providers e metadados; código de entrada de plugin confiável pode carregar, mas pule efeitos colaterais ao vivo. |
| `setup-only`    | Carregamento de metadados de configuração de canal por uma entrada leve de setup.                                               |
| `setup-runtime` | Carregamento de configuração de canal que também precisa da entrada de runtime.                                                 |
| `cli-metadata`  | Coleta apenas de metadados de comandos da CLI.                                                                                  |

Entradas de plugin que abrem sockets, bancos de dados, workers em segundo plano ou clientes
de longa duração devem proteger esses efeitos colaterais com `api.registrationMode === "full"`.
Carregamentos de descoberta são armazenados em cache separadamente dos carregamentos de ativação e não substituem
o registro do Gateway em execução. Descoberta não ativa, mas também não é livre de importação:
o OpenClaw pode avaliar a entrada do plugin confiável ou o módulo do plugin de canal para montar
o snapshot. Mantenha os níveis de topo do módulo leves e sem efeitos colaterais, e mova
clientes de rede, subprocessos, listeners, leituras de credenciais e inicialização de serviço
para caminhos de runtime completo.

Métodos comuns de registro:

| Method                                  | What it registers           |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provider de modelo (LLM)    |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Ferramenta do agent         |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida      |
| `registerSpeechProvider`                | Text-to-speech / STT        |
| `registerRealtimeTranscriptionProvider` | STT em streaming            |
| `registerRealtimeVoiceProvider`         | Voz duplex em tempo real    |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio     |
| `registerImageGenerationProvider`       | Geração de imagem           |
| `registerMusicGenerationProvider`       | Geração de música           |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provider de web fetch / scraping |
| `registerWebSearchProvider`             | Busca na web                |
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

Execuções nativas do app-server Codex fazem bridge de eventos de ferramenta nativos do Codex de volta para esta
superfície de hook. Plugins podem bloquear ferramentas nativas do Codex por `before_tool_call`,
observar resultados por `after_tool_call` e participar de aprovações
`PermissionRequest` do Codex. A bridge ainda não reescreve argumentos de ferramenta nativos do Codex. O limite exato de suporte do runtime Codex está no
[contrato de suporte Codex harness v1](/pt-BR/plugins/codex-harness#v1-support-contract).

Para o comportamento tipado completo de hooks, consulte [visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade de bundle Codex/Claude/Cursor
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agent em um plugin
- [Internals de Plugin](/pt-BR/plugins/architecture) — modelo de capacidades e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
