---
read_when:
    - Adição ou modificação de migrações do doctor
    - Introdução de alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-07-12T15:11:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo e migração do OpenClaw. Ela corrige configurações/estados obsoletos, verifica a integridade e fornece etapas de reparo práticas.

## Início rápido

```bash
openclaw doctor
```

### Modos headless e de automação

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Aceita os valores padrão sem solicitar confirmação (incluindo etapas de reinicialização/reparo de serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Aplica os reparos recomendados sem solicitar confirmação (`--repair` é um alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Executa verificações estruturadas de integridade para CI ou automação de pré-verificação. Somente leitura: sem
    solicitações, reparos, migrações, reinicializações ou gravações de estado.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Também aplica reparos agressivos (sobrescreve configurações personalizadas do supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Executa sem solicitações, aplicando apenas migrações seguras (normalização da configuração +
    movimentações de estado no disco). Ignora ações de reinicialização/serviço/sandbox que exigem
    confirmação humana. As migrações de estado legado ainda são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina os serviços do sistema em busca de instalações adicionais do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Para revisar as alterações antes da gravação, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## Modo lint somente leitura

`openclaw doctor --lint` é a contraparte voltada à automação de
`openclaw doctor --fix`. Ambos compartilham o mesmo registro de regras do Doctor, mas
não selecionam nem aplicam regras da mesma forma:

| Modo                     | Solicitações | Grava configuração/estado       | Saída                         | Use para                              |
| ------------------------ | ------------ | ------------------------------- | ----------------------------- | ------------------------------------- |
| `openclaw doctor`        | sim          | não                             | relatório de integridade amigável | uma pessoa verificando o status   |
| `openclaw doctor --fix`  | às vezes     | sim, com política de reparo     | log de reparo amigável        | aplicar reparos aprovados             |
| `openclaw doctor --lint` | não          | não                             | constatações estruturadas     | CI, pré-verificação e gates de revisão |

Por padrão, `doctor --lint` executa o perfil amplo e seguro de automação: verificações
estáticas, locais e úteis em saídas de CI ou pré-verificação. Ele ignora verificações opcionais
que sejam consultivas, sensíveis ao ambiente, dependentes de serviços ativos, relacionadas ao
inventário de contas/workspaces ou à limpeza histórica. Use `doctor --lint --all` quando quiser a
auditoria lint completa registrada, incluindo essas verificações opcionais, ou `--only <id>` para
uma verificação direcionada.

`doctor --fix` não usa o perfil lint padrão e não aceita
`--all`. Ele executa o caminho ordenado de reparo do Doctor: verificações modernas de integridade podem fornecer
uma implementação opcional de `repair()`, enquanto áreas mais antigas ainda usam seu fluxo de reparo
legado do Doctor. Algumas constatações lint são intencionalmente apenas diagnósticas; portanto, uma
verificação exibida em `--lint --all` não significa que `--fix` modificará essa área.
O contrato separa `detect()` (relata constatações) de `repair()` (relata
alterações/diffs/efeitos colaterais), mantendo aberto um caminho para um futuro
`doctor --fix --dry-run` sem transformar verificações lint em planejadores de mutação.

Algumas verificações integradas ficam desabilitadas por padrão internamente para permanecerem disponíveis para
`--all`, `--only` e os fluxos de reparo do Doctor sem fazerem parte do perfil padrão
de automação de `doctor --lint`. A gravidade da constatação ainda é emitida por
constatação (`info`, `warning` ou `error`); a seleção padrão não é um nível de
gravidade.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Campos da saída JSON:

- `ok`: se alguma constatação atingiu o limite de gravidade selecionado
- `checksRun` / `checksSkipped`: contagens (ignoradas pelo perfil, por `--only` ou por `--skip`)
- `findings`: diagnósticos estruturados com `checkId`, `severity`, `message` e, opcionalmente, `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`

Códigos de saída:

| Código | Significado                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| `0`    | nenhuma constatação no limite selecionado ou acima dele                        |
| `1`    | uma ou mais constatações atingiram o limite selecionado                        |
| `2`    | falha de comando/runtime antes que as constatações pudessem ser emitidas       |

Flags:

- `--severity-min info|warning|error` (padrão `warning`): controla tanto o que é exibido quanto o que causa uma saída diferente de zero.
- `--all`: executa todas as verificações lint registradas, incluindo verificações opcionais excluídas do conjunto padrão de automação.
- `--only <id>` (repetível): executa somente os IDs de verificação especificados; um ID desconhecido é relatado como constatação de erro.
- `--skip <id>` (repetível): exclui uma verificação enquanto mantém o restante da execução ativo.
- `--json`, `--severity-min`, `--all`, `--only` e `--skip` exigem `--lint`; execuções simples de `openclaw doctor` e `--fix` as rejeitam.

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Pré-atualização opcional para instalações via git (somente interativa).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o esquema do protocolo é mais recente).
    - Verificação de integridade + solicitação de reinicialização.
    - Resumo do status das Skills (elegíveis/ausentes/bloqueadas) e status dos plugins.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização da configuração para formatos de valores legados.
    - Migração da configuração de fala dos campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do MCP do Chrome.
    - Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migração do provedor/perfil legado OpenAI Codex (`openai-codex` → `openai`) e avisos de sobreposição para `models.providers.openai-codex` obsoleto.
    - Verificação dos pré-requisitos de TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Avisos de lista de permissões de plugins/ferramentas quando `plugins.allow` é restritivo, mas a política de ferramentas ainda solicita curingas ou ferramentas pertencentes a plugins.
    - Migração de estado legado no disco (sessões/diretório do agente/autenticação do WhatsApp).
    - Migração de chaves legadas do contrato do manifesto do plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, `provider` do payload, tarefas de fallback de Webhook com `notify: true`).
    - Reparo da fixação de runtime da CLI do Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) em `agents.defaults`, `agents.list[]` e `models.providers.*` (incluindo entradas por modelo).
    - Limpeza de configurações obsoletas de plugins quando os plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas a plugins são preservadas como configuração inerte de contenção.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcrições de sessão para ramificações duplicadas de reescrita de prompt criadas por builds 2026.4.24 afetadas.
    - Detecção de marcadores de recuperação de reinicialização de subagentes travados, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada, evitando que a inicialização continue tratando o processo filho como abortado por reinicialização.
    - Verificações de integridade e permissões do estado (sessões, transcrições, diretório de estado).
    - Verificações de permissão do arquivo de configuração (chmod 600) durante a execução local.
    - Integridade da autenticação do modelo: verifica a expiração do OAuth, pode atualizar tokens próximos da expiração e relata estados de espera/desabilitados do perfil de autenticação.

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo da imagem de sandbox quando o isolamento em sandbox está habilitado.
    - Migração de serviços legados e detecção de gateways adicionais.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canais (consultados no gateway em execução).
    - As verificações de permissões específicas de canais ficam em `openclaw channels capabilities`; por exemplo, as permissões de canal de voz do Discord são auditadas com `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Verificações de responsividade do WhatsApp para integridade degradada do loop de eventos do Gateway com clientes TUI locais ainda em execução; `--fix` interrompe somente clientes TUI locais verificados.
    - Reparo de rotas do Codex para referências legadas de modelo `openai-codex/*` em modelos primários, fallbacks, modelos de geração de imagem/vídeo, substituições de Heartbeat/subagente/Compaction, hooks, substituições de modelo de canal e fixações de rota de sessão; `--fix` as reescreve para `openai/*`, migra perfis/ordem de autenticação `openai-codex:*` para `openai:*`, remove fixações obsoletas de runtime da sessão/do agente inteiro e permite que a rota efetiva reparada determine se o Codex é compatível.
    - Auditoria da configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de variáveis de ambiente de proxy incorporadas para serviços do Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de práticas recomendadas do runtime do Gateway (Node em comparação com Bun, caminhos de gerenciadores de versão).
    - Diagnósticos de colisão da porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas abertas de mensagens diretas.
    - Verificações de autenticação do Gateway para o modo de token local (oferece geração de token quando não existe uma fonte de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivos (solicitações pendentes de primeiro pareamento, atualizações pendentes de função/escopo, divergência obsoleta do cache local de tokens de dispositivo e divergência de autenticação do registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de permanência do systemd no Linux.
    - Verificação do tamanho do arquivo de inicialização do workspace (avisos de truncamento/proximidade do limite para arquivos de contexto).
    - Verificação de prontidão das Skills para o agente padrão; relata Skills permitidas com binários, ambiente, configuração ou requisitos de sistema operacional ausentes, e `--fix` pode desabilitar Skills indisponíveis em `skills.entries`.
    - Verificação do status de conclusão do shell e instalação/atualização automática.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade do workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava a configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Preenchimento retroativo e redefinição da UI de Dreams

A cena Dreams da Control UI inclui as ações **Preenchimento retroativo**, **Redefinir** e **Limpar Grounded** para o fluxo de trabalho de dreaming grounded. Elas usam métodos RPC de estilo doctor do Gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

| Ação                     | O que faz                                                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preenchimento retroativo | Examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM grounded e grava entradas reversíveis de preenchimento retroativo em `DREAMS.md`.                 |
| Redefinir                | Remove somente as entradas marcadas de diário de preenchimento retroativo de `DREAMS.md`.                                                                                                                |
| Limpar Grounded          | Remove somente entradas temporárias preparadas exclusivas do modo grounded da reprodução histórica que ainda não acumularam recuperação ativa nem suporte diário.                                        |

  Nenhuma dessas opções edita `MEMORY.md`, executa migrações completas do doctor nem coloca, por conta própria, candidatos fundamentados no armazenamento ativo de promoção de curto prazo. Para alimentar a reprodução histórica fundamentada na via normal de promoção profunda, use o fluxo da CLI:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Isso coloca candidatos duráveis fundamentados no armazenamento de Dreaming de curto prazo, enquanto `DREAMS.md` permanece como a superfície de revisão.

  ## Comportamento detalhado e justificativa

  <AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout do git e o doctor estiver sendo executado interativamente, ele oferecerá uma atualização (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização da configuração">
    O doctor normaliza formatos de valores legados para o esquema atual. A configuração atual de fala do Talk é `talk.provider` + `talk.providers.<provider>`, com a configuração de voz em tempo real em `talk.realtime.*`. O doctor reescreve os formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedores e reescreve os seletores legados de tempo real no nível superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) em `talk.realtime`.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa curingas ou entradas de ferramentas pertencentes a plugins. `tools.allow: ["*"]` corresponde apenas às ferramentas dos plugins que realmente são carregados; ele não ignora a lista de permissões exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém uma chave obsoleta com uma migração ativa, os outros comandos se recusam a executar e solicitam que você execute `openclaw doctor`. O doctor explica quais chaves legadas foram encontradas, mostra a migração aplicada e reescreve `~/.openclaw/openclaw.json` com o esquema atualizado. A inicialização do Gateway recusa formatos de configuração legados e solicita que você execute `openclaw doctor --fix`; ela não reescreve `openclaw.json` durante a inicialização. As migrações do armazenamento de tarefas Cron também são tratadas por `openclaw doctor --fix`.

    <Note>
      O doctor mantém migrações automáticas apenas por aproximadamente dois meses após a
      desativação de uma chave. Chaves legadas mais antigas (por exemplo, as chaves originais
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` no nível superior ou `identity` no nível superior
      do formato de configuração anterior ao suporte a múltiplos agentes) não têm mais um caminho de migração;
      configurações que as utilizam agora falham na validação em vez de serem reescritas. Corrija
      essas chaves manualmente de acordo com a referência de configuração atual antes que o doctor
      possa prosseguir.
    </Note>

    Migrações ativas:

    | Chave legada                                                                                    | Chave atual                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | removidas (o WebChat foi descontinuado)                                     |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (e por conta)          | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados        | `talk.provider` + `talk.providers.<provider>`                               |
    | seletores legados de tempo real do Talk no nível superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | campos de locutor TTS `voice`/`voiceName`/`voiceId`                                              | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (todos os canais, exceto Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (todos os canais, incluindo Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (a inicialização do Gateway também ignora provedores cujo `api` seja um valor de enumeração futuro/desconhecido, em vez de falhar de forma fechada) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | removida (configuração legada de retransmissão da extensão do Chrome)       |
    | `mcp.servers.*.type` (aliases nativos da CLI)                                                    | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | removida (o app-server do Codex sempre mantém nativas as ferramentas de workspace próprias do Codex) |
    | `commands.modelsWrite`                                                                           | removida (`/models add` está obsoleto)                                      |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | removidas (o valor exato `NO_REPLY` não é mais reescrito como texto alternativo visível) |
    | `agents.defaults/list[].systemPromptOverride`                                                    | removida (o OpenClaw controla o prompt de sistema gerado)                  |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | removida (use `models.providers.<id>.timeoutSeconds` para tempos limite de modelos/provedores lentos, mantidos abaixo do limite máximo de tempo do agente/da execução) |
    | `memorySearch` no nível superior                                                                 | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (em qualquer nível)                                                    | removida (os índices de memória ficam no banco de dados de cada agente)    |
    | `heartbeat` no nível superior                                                                    | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | IDs de política `plugins.openai-codex`                                                           | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | removidas (obsoletas)                                                       |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      As linhas `plugins.entries.voice-call.config.*` acima são normalizadas pelo
      próprio plugin Voice Call em cada carregamento da configuração, não pelo `openclaw
      doctor`. O plugin também registra um aviso de inicialização indicando `openclaw
      doctor --fix`, mas atualmente o doctor não reescreve
      `openclaw.json` para essas chaves; é a normalização do próprio plugin que
      aplica a alteração em tempo de execução.
    </Note>

    Orientações de conta padrão para canais com múltiplas contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisará que o roteamento alternativo pode selecionar uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisará e listará os IDs das contas configuradas.

  </Accordion>
  <Accordion title="2b. Substituições do provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo integrado do OpenCode de `openclaw/plugin-sdk/llm`. Isso pode forçar modelos a usar a API errada ou zerar os custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API por modelo e os custos.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão do Chrome MCP">
    Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de conexão do Chrome MCP local ao host (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` removido).

    O doctor também audita o caminho do Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis de conexão automática padrão
    - verifica a versão detectada do Chrome e avisa quando ela é anterior ao Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O Doctor não pode habilitar a configuração do Chrome para você. O Chrome MCP local ao host ainda exige um navegador baseado em Chromium 144+ no host do Gateway/Node, executado localmente, com a depuração remota habilitada e a primeira solicitação de consentimento para anexação aprovada no navegador.

    A prontidão aqui abrange apenas os pré-requisitos de anexação local. O uso da sessão existente mantém os limites atuais de rotas do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto. Essa verificação não se aplica a Docker, sandbox, navegador remoto ou outros fluxos headless, que continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor consulta o endpoint de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a consulta falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor exibe orientações de correção específicas para a plataforma. No macOS com um Node instalado pelo Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a consulta é executada mesmo que o Gateway esteja íntegro.
  </Accordion>
  <Accordion title="2e. Substituições do provedor OAuth do Codex">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem se sobrepor ao caminho integrado do provedor OAuth do Codex. O doctor emite um aviso quando encontra essas configurações antigas de transporte junto com o OAuth do Codex, para que você possa remover ou reescrever a substituição obsoleta de transporte e restaurar o comportamento atual de roteamento. Proxies personalizados e substituições apenas de cabeçalhos continuam compatíveis e não acionam esse aviso, mas essas rotas de solicitação definidas pelo usuário não são elegíveis para a seleção implícita do Codex.
  </Accordion>
  <Accordion title="2f. Reparo de rotas do Codex">
    O doctor verifica referências legadas de modelos `openai-codex/*`. O roteamento nativo do harness do Codex usa referências canônicas de modelos `openai/*`, mas o prefixo por si só nunca seleciona o Codex. Quando a política de runtime não está definida ou é `auto`, apenas uma rota HTTPS oficial e exata de Platform Responses ou ChatGPT Responses, sem substituição de solicitação definida pelo usuário, é elegível. Consulte [runtime implícito de agente da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime).

    No modo `--fix` / `--repair`, o doctor reescreve as referências afetadas do agente padrão e de cada agente, incluindo modelos principais, fallbacks, modelos de geração de imagens/vídeos, substituições de Heartbeat/subagente/Compaction, hooks, substituições de modelo de canal e estado obsoleto de rota persistido na sessão:

    - `openai-codex/gpt-*` torna-se `openai/gpt-*`.
    - A intenção de usar o Codex é movida para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo nas referências de modelos de agentes reparadas.
    - Configurações obsoletas de runtime do agente inteiro e fixações persistidas de runtime da sessão são removidas porque a seleção de runtime tem escopo de provedor/modelo.
    - A política de runtime existente do provedor/modelo é preservada, a menos que a referência legada de modelo reparada precise do roteamento do Codex para manter o caminho de autenticação antigo.
    - As listas existentes de fallbacks de modelos são preservadas, com suas entradas legadas reescritas; as configurações copiadas por modelo são movidas da chave legada para a chave canônica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de fallback e fixações de perfil de autenticação persistidos na sessão são reparados em todos os armazenamentos de sessões de agentes descobertos.
    - Separadamente, o doctor repara fixações obsoletas de `agentRuntime.id: "codex-cli"` (um ID de runtime legado distinto) para `"codex"` em `agents.defaults`, `agents.list[]` e nas entradas de modelos de `models.providers.*`.
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex pelo chat".
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx".

  </Accordion>
  <Accordion title="2g. Limpeza de rotas de sessão">
    O doctor também verifica os armazenamentos de sessões de agentes descobertos em busca de estado obsoleto de rotas criadas automaticamente após você transferir modelos configurados ou o runtime de uma rota pertencente a um Plugin, como o Codex.

    `openclaw doctor --fix` pode limpar estados obsoletos criados automaticamente, como fixações de modelo com `modelOverrideSource: "auto"`, metadados de modelo do runtime, IDs de harness fixados, vinculações de sessão da CLI e substituições automáticas de perfil de autenticação quando a rota proprietária correspondente não está mais configurada. As escolhas explícitas do usuário ou legadas de modelo da sessão são relatadas para revisão manual e permanecem inalteradas; altere-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais desejada.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O Doctor pode migrar layouts antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições: de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente: de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys): dos arquivos legados `~/.openclaw/credentials/*.json` (exceto `oauth.json`) para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são realizadas na medida do possível e são idempotentes; o Doctor emite avisos quando deixa pastas legadas como backups. O Gateway/CLI também migra automaticamente o diretório legado de sessões + agente na inicialização, para que histórico/autenticação/modelos sejam movidos para o caminho por agente sem a execução manual do Doctor. A autenticação do WhatsApp é intencionalmente migrada somente por meio de `openclaw doctor`. A normalização do provedor de conversação/mapa de provedores compara por igualdade estrutural; portanto, diferenças apenas na ordem das chaves não acionam mais alterações nulas repetidas de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifestos de plugins legados">
    O Doctor verifica todos os manifestos de plugins instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece a opção de movê-las para o objeto `contracts` e regravar o arquivo de manifesto no local. Essa migração é idempotente; se `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar dados.
  </Accordion>
  <Accordion title="3b. Migrações do armazenamento legado do Cron">
    O Doctor também verifica o armazenamento de tarefas do Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de tarefas que o agendador ainda aceita por compatibilidade.

    As limpezas atuais do Cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - tarefas Webhook legadas de fallback com `notify: true` → entrega explícita por Webhook a partir de `cron.webhook` quando definido; tarefas de anúncio mantêm a entrega no chat e recebem `delivery.completionDestination`. Quando `cron.webhook` não está definido, o marcador inerte de nível superior `notify` é removido das tarefas sem destino (a entrega existente, incluindo anúncios, é preservada), pois a entrega em tempo de execução nunca o lê.

    O Gateway também higieniza linhas malformadas do Cron durante o carregamento para que as tarefas válidas continuem em execução. As linhas brutas malformadas são copiadas para `jobs-quarantine.json` ao lado do armazenamento ativo antes de serem removidas de `jobs.json`; o Doctor informa as linhas em quarentena para que você possa revisá-las ou repará-las manualmente.

    A inicialização do Gateway normaliza a projeção em tempo de execução e ignora o marcador de nível superior `notify`, mas mantém a configuração persistida do Cron para reparo pelo Doctor. Quando `cron.webhook` não está definido, o Doctor remove o marcador inerte das tarefas sem destino de migração (`delivery.mode` ausente ou igual a none, um destino de Webhook inutilizável ou uma entrega existente de anúncio/chat), mantendo a entrega existente intacta, para que execuções repetidas de `doctor --fix` não voltem a emitir avisos sobre a mesma tarefa. Se `cron.webhook` estiver definido, mas não for uma URL HTTP(S) válida, o Doctor ainda emitirá um aviso e manterá o marcador para que você possa corrigir a URL.

    No Linux, o Doctor também avisa quando o crontab do usuário ainda invoca o script legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o Cron não consegue acessar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O Doctor verifica todos os diretórios de sessão dos agentes em busca de arquivos obsoletos de bloqueio de gravação deixados para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de bloqueio encontrado, ele informa: o caminho, o PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID inativo, metadados de proprietário malformados, mais de 30 minutos ou um PID ativo comprovadamente pertencente a um processo que não é do OpenClaw). No modo `--fix` / `--repair`, ele remove automaticamente bloqueios com proprietários inativos, órfãos, reciclados, malformados e antigos ou que não sejam do OpenClaw. Bloqueios antigos ainda pertencentes a um processo ativo do OpenClaw são informados, mas mantidos no local, para que o Doctor não interrompa um gravador de transcrição ativo.
  </Accordion>
  <Accordion title="3d. Reparo de ramificações de transcrições de sessão">
    O Doctor verifica os arquivos JSONL das sessões dos agentes em busca da estrutura de ramificação duplicada criada pelo bug de regravação de transcrições de prompts da versão 2026.4.24: um turno abandonado do usuário com contexto interno de tempo de execução do OpenClaw e um turno irmão ativo contendo o mesmo prompt visível do usuário. No modo `--fix` / `--repair`, o Doctor cria um backup de cada arquivo afetado ao lado do original e regrava a transcrição para a ramificação ativa, para que os leitores do histórico e da memória do Gateway não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade do estado (persistência de sessões, roteamento e segurança)">
    O diretório de estado é o tronco encefálico operacional. Se ele desaparecer, você perderá sessões, credenciais, logs e configurações, a menos que tenha backups em outro lugar.

    O Doctor verifica:

    - **Diretório de estado ausente**: alerta sobre perda catastrófica de estado, solicita a recriação do diretório e lembra que não é possível recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica se há permissão de gravação; oferece o reparo das permissões (e exibe uma dica de `chown` quando é detectada uma incompatibilidade de proprietário/grupo).
    - **Diretório de estado sincronizado com a nuvem no macOS**: alerta quando o estado é resolvido no iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou em `~/Library/CloudStorage/...`, pois caminhos com sincronização podem causar E/S mais lenta e condições de corrida de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: alerta quando o estado é resolvido para uma origem de montagem `mmcblk*`, pois a E/S aleatória em SD/eMMC pode ser mais lenta e causar desgaste mais rápido durante gravações de sessões e credenciais.
    - **Diretório de estado volátil no Linux**: alerta quando o estado é resolvido para `tmpfs` ou `ramfs`, pois sessões, credenciais, configuração e o estado do SQLite (com arquivos auxiliares de WAL/diário) desaparecem na reinicialização. Montagens `overlay` do Docker não são sinalizadas intencionalmente, pois suas camadas graváveis persistem entre reinicializações do host enquanto o contêiner permanecer.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir o histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: alerta quando entradas recentes de sessão têm arquivos de transcrição ausentes.
    - **Sessão principal com "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está sendo acumulado).
    - **Vários diretórios de estado**: alerta quando há várias pastas `~/.openclaw` em diretórios pessoais ou quando `OPENCLAW_STATE_DIR` aponta para outro local (o histórico pode ficar dividido entre instalações).
    - **Lembrete do modo remoto**: se `gateway.mode=remote`, o doctor lembra que ele deve ser executado no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: alerta se `~/.openclaw/openclaw.json` puder ser lido pelo grupo ou por todos e oferece restringir as permissões para `600`.

  </Accordion>
  <Accordion title="5. Integridade da autenticação do modelo (expiração do OAuth)">
    O Doctor inspeciona os perfis OAuth no armazenamento de autenticação, alerta quando os tokens estão prestes a expirar ou já expiraram e pode atualizá-los quando for seguro. Se o perfil OAuth/de token da Anthropic estiver desatualizado, ele sugere uma chave de API da Anthropic ou o caminho do token de configuração da Anthropic. As solicitações de atualização só aparecem durante a execução interativa (TTY); `--non-interactive` ignora as tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor solicita que você entre novamente), o doctor informa que uma nova autenticação é necessária e exibe o comando exato `openclaw models auth login --provider ...` que deve ser executado.

    O Doctor também informa perfis de autenticação temporariamente inutilizáveis devido a períodos curtos de espera (limites de taxa/tempos limite/falhas de autenticação) ou desativações mais longas (falhas de faturamento/crédito).

    Perfis OAuth legados do Codex cujos tokens ficam nas Chaves do macOS (integração inicial mais antiga, anterior ao layout de arquivo auxiliar) são reparados somente pelo doctor. Execute `openclaw doctor --fix` uma vez em um terminal interativo para migrar, no próprio local, os tokens legados armazenados nas Chaves para `auth-profiles.json`; depois disso, execuções incorporadas (Telegram, cron, despacho de subagentes) os resolvem como perfis OAuth canônicos da OpenAI.

  </Accordion>
  <Accordion title="6. Validação do modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo em relação ao catálogo e à lista de permissões e alerta quando ela não puder ser resolvida ou não for permitida.
  </Accordion>
  <Accordion title="7. Reparo da imagem do sandbox">
    Quando o sandbox está habilitado, o doctor verifica as imagens do Docker e oferece compilar ou mudar para nomes legados caso a imagem atual esteja ausente.
  </Accordion>
  <Accordion title="7b. Limpeza da instalação de plugins">
    O Doctor remove o estado legado de preparação de dependências de plugins gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`: raízes de dependências geradas obsoletas, diretórios antigos de preparação de instalação, resíduos locais de pacotes provenientes do código anterior de reparo de dependências de plugins incluídos e cópias npm gerenciadas órfãs ou recuperadas de plugins `@openclaw/*` incluídos que podem sobrepor o manifesto incluído atual. O Doctor também recria o vínculo do pacote `openclaw` do host em plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que importações locais do pacote em tempo de execução, como `openclaw/plugin-sdk/*`, continuem sendo resolvidas após atualizações ou reparos do npm.

    O Doctor também pode reinstalar plugins baixáveis ausentes quando a configuração faz referência a eles, mas o registro local de plugins não consegue encontrá-los (`plugins.entries` relevantes, configurações definidas de canal/provedor/pesquisa e runtimes de agentes configurados). Durante atualizações de pacotes, o doctor evita reinstalar pacotes de plugins enquanto o pacote principal está sendo substituído; execute `openclaw doctor --fix` novamente após a atualização se um plugin configurado ainda precisar de recuperação. Fora da exceção de inicialização da imagem de contêiner descrita abaixo, a inicialização do Gateway e o recarregamento da configuração não executam reparos de pacotes; as instalações de plugins continuam sendo tarefas explícitas do doctor/de instalação/de atualização.

    A inicialização do Gateway em contêiner tem uma exceção restrita para atualizações: quando `openclaw gateway run` é iniciado em uma nova versão do OpenClaw, ele executa migrações de estado seguras e a convergência existente de plugins após a atualização do núcleo antes de ficar pronto e, em seguida, registra um ponto de verificação por versão. Essa etapa de inicialização pode limpar registros obsoletos de plugins incluídos, reparar vínculos locais de plugins, reinstalar pacotes de plugins configurados quando o caminho de convergência exigir e verificar cargas úteis de plugins ativos. Se a inicialização não conseguir executar o reparo com segurança, execute a mesma imagem uma vez com `openclaw doctor --fix` usando o mesmo estado/configuração montado antes de reiniciar o contêiner normalmente.

  </Accordion>
  <Accordion title="8. Migrações do serviço do Gateway e dicas de limpeza">
    O Doctor detecta serviços legados do Gateway (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço do OpenClaw usando a porta atual do Gateway. Ele também pode procurar outros serviços semelhantes ao Gateway e exibir dicas de limpeza. Serviços do Gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "adicionais".

    No Linux, se o serviço do Gateway no nível do usuário estiver ausente, mas existir um serviço do Gateway do OpenClaw no nível do sistema, o doctor não instala automaticamente um segundo serviço no nível do usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep` e, em seguida, remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor do sistema for responsável pelo ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração do Matrix na inicialização">
    Quando uma conta de canal do Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot anterior à migração e depois executa as etapas de migração em regime de melhor esforço: migração do estado legado do Matrix e preparação do estado criptografado legado. Nenhuma das etapas é fatal; os erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivos e divergência de autenticação">
    O Doctor inspeciona o estado de pareamento de dispositivos como parte da verificação normal de integridade, informando:

    - solicitações pendentes de primeiro pareamento
    - atualizações pendentes de função ou escopo para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o ID do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos divergem da linha de base de pareamento aprovada
    - entradas locais em cache de tokens de dispositivo da máquina atual que são anteriores a uma rotação de token no Gateway ou contêm metadados de escopo obsoletos

    O Doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Ele exibe exatamente as próximas etapas:

    - inspecione as solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um novo token com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso distingue o primeiro pareamento de atualizações pendentes de função/escopo e da divergência de token/identidade de dispositivo obsoletos, eliminando a falha comum de "já pareado, mas ainda recebendo a exigência de pareamento".

  </Accordion>
  <Accordion title="9. Alertas de segurança">
    O Doctor emite alertas quando um provedor está aberto a mensagens diretas sem uma lista de permissões ou quando uma política está configurada de maneira perigosa.
  </Accordion>
  <Accordion title="10. Permanência do systemd (Linux)">
    Se estiver sendo executado como um serviço de usuário do systemd, o doctor garante que a permanência esteja habilitada para que o Gateway continue ativo após o encerramento da sessão.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, plugins e TaskFlows)">
    O Doctor exibe um resumo do estado do workspace para o agente padrão:

    - **Status das Skills**: contabiliza Skills elegíveis, com requisitos ausentes e bloqueadas pela lista de permissões.
    - **Status dos plugins**: contabiliza plugins habilitados/desabilitados/com erros; lista os IDs dos plugins que apresentam erros; informa os recursos dos plugins incluídos.
    - **Alertas de compatibilidade de plugins**: sinaliza plugins com problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de plugins**: apresenta todos os alertas ou erros emitidos pelo registro de plugins durante o carregamento.
    - **Recuperação do TaskFlow**: apresenta TaskFlows gerenciados suspeitos que precisam de inspeção manual ou cancelamento.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O Doctor verifica se os arquivos de bootstrap do workspace (por exemplo, `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele informa, para cada arquivo, a contagem de caracteres bruta em comparação com a injetada, a porcentagem de truncamento, a causa do truncamento (`max/file` ou `max/total`) e o total de caracteres injetados como uma fração do orçamento total. Quando os arquivos são truncados ou estão próximos do limite, o doctor exibe dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Preenchimento automático do shell">
    O Doctor verifica se o preenchimento por tabulação está instalado para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usar um padrão lento de preenchimento dinâmico (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida com arquivo em cache.
    - Se o preenchimento estiver configurado no perfil, mas o arquivo de cache estiver ausente, o doctor recria o cache automaticamente.
    - Se nenhum preenchimento estiver configurado, o doctor solicita sua instalação (somente no modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para recriar o cache manualmente.

  </Accordion>
  <Accordion title="11d. Limpeza de plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que fazia referência ao plugin: entradas `channels.<id>`, destinos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway nos quais o runtime do canal não existe mais, mas a configuração ainda solicita que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O Doctor verifica a prontidão da autenticação por token do Gateway local.

    - Se o modo de token exigir um token e não houver uma origem de token, o doctor oferece gerar um.
    - Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor alerta e não o substitui por texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura compatíveis com SecretRef">
    Alguns fluxos de reparo precisam inspecionar as credenciais configuradas sem enfraquecer o comportamento de falha imediata do runtime.

    - `openclaw doctor --fix` usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `@username` em `allowFrom` / `groupAllowFrom` do Telegram tenta usar as credenciais configuradas do bot quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade e reinicialização do Gateway">
    O doctor executa uma verificação de integridade e oferece a opção de reiniciar o Gateway quando ele parece não estar íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da pesquisa de memória">
    O doctor verifica se o provedor de embeddings configurado para a pesquisa de memória está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, exibe orientações de correção, incluindo `npm install -g @tobilu/qmd` (ou o equivalente do Bun), e uma opção para especificar manualmente o caminho do binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL reconhecida de modelo remoto/para download. Se estiver ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se há uma chave de API no ambiente ou no armazenamento de autenticação. Exibe sugestões práticas de correção se estiver ausente.
    - **Provedor automático legado**: trata `memorySearch.provider: "auto"` como OpenAI, verifica a prontidão do OpenAI e `doctor --fix` o reescreve como `provider: "openai"`.

    Quando um resultado de sondagem do Gateway em cache está disponível (o Gateway estava íntegro no momento da verificação), o doctor cruza esse resultado com a configuração visível pela CLI e informa qualquer divergência. O doctor não inicia uma nova sondagem de embeddings no caminho padrão; use o comando de status detalhado da memória quando quiser uma verificação em tempo real do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão dos embeddings em tempo de execução.

  </Accordion>
  <Accordion title="14. Avisos de status dos canais">
    Se o Gateway estiver íntegro, o doctor executa uma sondagem de status dos canais e informa avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria e reparo da configuração do supervisor">
    O doctor verifica se a configuração instalada do supervisor (launchd/systemd/schtasks) tem padrões ausentes ou desatualizados (por exemplo, dependências de network-online do systemd e atraso de reinicialização). Quando encontra uma divergência, recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa com os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações de reparo padrão.
    - `openclaw doctor --fix` aplica as correções recomendadas sem solicitar confirmação (`--repair` é um alias).
    - `openclaw doctor --fix --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do Gateway. Ele ainda informa a integridade do serviço e executa reparos não relacionados ao serviço, mas ignora instalação/inicialização/reinicialização/bootstrap do serviço, reescritas da configuração do supervisor e limpeza de serviços legados, pois um supervisor externo é responsável por esse ciclo de vida.
    - No Linux, o doctor não reescreve os metadados de comando/ponto de entrada enquanto a unidade systemd correspondente do Gateway está ativa. Ele também ignora unidades extras inativas, não legadas e semelhantes ao Gateway durante a verificação de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/o reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores resolvidos do token em texto simples nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente do serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows incorporaram diretamente e reescreve os metadados do serviço para que esses valores sejam carregados da origem de tempo de execução, em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa um `--port` antigo após alterações em `gateway.port` e reescreve os metadados do serviço com a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef configurado do token não for resolvido, o doctor bloqueia o caminho de instalação/reparo e fornece orientações práticas.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/o reparo até que o modo seja definido explicitamente.
    - Para unidades systemd de usuário no Linux, as verificações de divergência de token do doctor incluem as origens `Environment=` e `EnvironmentFile=` ao comparar os metadados de autenticação do serviço.
    - Os reparos de serviço do doctor recusam-se a reescrever, parar ou reiniciar um serviço do Gateway usando um binário antigo do OpenClaw quando a configuração foi gravada pela última vez por uma versão mais recente. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa usando `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnóstico do tempo de execução e da porta do Gateway">
    O doctor inspeciona o tempo de execução do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica conflitos na porta do Gateway (padrão `18789`) e informa as causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Práticas recomendadas para o tempo de execução do Gateway">
    O doctor avisa quando o serviço do Gateway é executado no Bun ou em um caminho do Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf` etc.). Os canais WhatsApp e Telegram exigem Node, e os caminhos de gerenciadores de versão podem deixar de funcionar após atualizações porque o serviço não carrega a inicialização do seu shell. O doctor oferece a migração para uma instalação de sistema do Node quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que os binários do sistema gerenciados pelo Homebrew permaneçam disponíveis, enquanto os diretórios do Volta, asdf, fnm, pnpm e de outros gerenciadores de versão não alterem qual Node os processos filhos resolvem. Os serviços do Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios estáveis de binários do usuário, mas diretórios alternativos presumidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco.

  </Accordion>
  <Accordion title="18. Gravação da configuração e metadados do assistente">
    O doctor persiste todas as alterações de configuração e registra metadados do assistente para documentar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas sobre o workspace (backup e sistema de memória)">
    O doctor sugere um sistema de memória para o workspace quando ele está ausente e exibe uma dica de backup se o workspace ainda não estiver sob controle do git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para obter um guia completo sobre a estrutura do workspace e backup com git (recomenda-se um GitHub ou GitLab privado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
