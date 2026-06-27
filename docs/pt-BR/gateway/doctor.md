---
read_when:
    - Adicionando ou modificando migrações do doctor
    - Introduzindo alterações incompatíveis de configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-06-27T17:30:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configurações/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

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

    Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinicialização/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Aplica os reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Executa verificações de integridade estruturadas para CI ou automação de preflight. Este modo é
    somente leitura: ele não solicita confirmação, repara, migra configuração, reinicia serviços nem
    toca no estado.

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

    Executa sem solicitações e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## Modo lint somente leitura

`openclaw doctor --lint` é o equivalente amigável para automação de
`openclaw doctor --fix`. Ambos usam verificações de integridade do doctor, mas suas posturas são
diferentes:

| Modo                     | Solicitações | Grava configuração/estado | Saída                         | Use para                         |
| ------------------------ | ------------ | -------------------------- | ----------------------------- | -------------------------------- |
| `openclaw doctor`        | sim          | não                        | relatório de integridade amigável | uma pessoa verificando status    |
| `openclaw doctor --fix`  | às vezes     | sim, com política de reparo | log de reparo amigável        | aplicar reparos aprovados        |
| `openclaw doctor --lint` | não          | não                        | achados estruturados          | CI, preflight e gates de revisão |

Verificações de integridade modernizadas podem fornecer uma implementação opcional de `repair()`.
`doctor --fix` aplica esses reparos quando eles existem e continua usando o
fluxo de reparo existente do doctor para verificações que ainda não foram migradas.
O contrato de reparo estruturado também separa o relatório de reparo da detecção:
`detect()` relata os achados atuais, enquanto `repair()` pode relatar alterações,
diffs de configuração/arquivo e efeitos colaterais que não envolvem arquivos. Isso mantém o caminho de migração aberto
para futuros `doctor --fix --dry-run` e saída de diff sem fazer verificações de lint
planejarem mutações.

Exemplos:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

A saída JSON inclui:

- `ok`: se algum achado visível atingiu o limite de severidade selecionado
- `checksRun`: número de verificações de integridade executadas
- `checksSkipped`: verificações ignoradas pelo perfil selecionado, `--only` ou `--skip`
- `findings`: diagnósticos estruturados com `checkId`, `severity`, `message` e
  `path`, `line`, `column`, `ocPath` e `fixHint` opcionais

Códigos de saída:

- `0`: nenhum achado no limite selecionado ou acima dele
- `1`: um ou mais achados atingiram o limite selecionado
- `2`: falha de comando/runtime antes que achados de lint pudessem ser emitidos

Use `--severity-min info|warning|error` para controlar tanto o que é impresso quanto o que
causa uma saída de lint diferente de zero. Use `--all` para executar o inventário completo de lint,
incluindo verificações mais profundas de adesão opcional excluídas do conjunto de automação padrão. Use `--only <id>` para gates de preflight estreitos e
`--skip <id>` para excluir temporariamente uma verificação ruidosa enquanto mantém o restante da
execução de lint ativa.
Opções de saída de lint como `--json`, `--severity-min`, `--all`, `--only` e
`--skip` devem ser combinadas com `--lint`; execuções regulares de doctor e reparo as rejeitam.

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização preflight opcional para instalações via git (somente interativo).
    - Verificação de atualização do protocolo da UI (recria a Control UI quando o esquema do protocolo é mais recente).
    - Verificação de integridade + solicitação de reinicialização.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migração de provedor/perfil legado OpenAI Codex (`openai-codex` → `openai`) e avisos de sombreamento para `models.providers.openai-codex` obsoleto.
    - Verificação de pré-requisitos TLS do OAuth para perfis OAuth do OpenAI Codex.
    - Avisos de allowlist de plugins/ferramentas quando `plugins.allow` é restritivo, mas a política de ferramentas ainda solicita curingas ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessions/agent dir/auth do WhatsApp).
    - Migração de chaves de contrato de manifesto de plugin legado (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração de armazenamento Cron legado (`jobId`, `schedule.cron`, campos de delivery/payload no nível superior, payload `provider`, jobs de fallback de webhook `notify: true`).
    - Limpeza de política de runtime legada do agente inteiro; a política de runtime de provedor/modelo é o seletor de rota ativo.
    - Limpeza de configuração de plugin obsoleta quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas de plugin são tratadas como configuração de contenção inerte e são preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcritos de sessão para branches duplicados de reescrita de prompt criados por builds 2026.4.24 afetados.
    - Detecção de tombstone de recuperação por reinicialização de subagente travado, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcritos, diretório de estado).
    - Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelos: verifica expiração do OAuth, pode atualizar tokens prestes a expirar e relata estados de cooldown/desabilitado do perfil de autenticação.

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando sandboxing está habilitado.
    - Migração de serviço legado e detecção de gateway extra.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do gateway em execução).
    - Verificações de permissão específicas de canal ficam em `openclaw channels capabilities`; por exemplo, permissões de canal de voz do Discord são auditadas com `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Verificações de responsividade do WhatsApp para integridade degradada do loop de eventos do Gateway com clientes TUI locais ainda em execução; `--fix` interrompe apenas clientes TUI locais verificados.
    - Reparo de rota do Codex para refs de modelo legadas `openai-codex/*` em modelos primários, fallbacks, modelos de geração de imagem/vídeo, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo por canal e pins de rota de sessão; `--fix` as reescreve para `openai/*`, migra perfis/ordem de autenticação `openai-codex:*` para `openai:*`, remove pins obsoletos de runtime de sessão/agente inteiro e deixa refs canônicas de agentes OpenAI no harness Codex padrão.
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de ambiente de proxy embutido para serviços de gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de práticas recomendadas de runtime do Gateway (Node vs Bun, caminhos de gerenciadores de versão).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas de DM abertas.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando nenhuma origem de token existe; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivo (solicitações pendentes de primeiro pareamento, upgrades pendentes de papel/escopo, drift obsoleto do cache local de token de dispositivo e drift de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/quase limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata Skills permitidas com bins, env, configuração ou requisitos de SO ausentes, e `--fix` pode desabilitar Skills indisponíveis em `skills.entries`.
    - Verificação de status de conclusão do shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Backfill e redefinição da UI de Dreams

A cena Dreams da Control UI inclui ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de grounded dreaming. Essas ações usam métodos RPC no estilo gateway doctor, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** examina arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentado e grava entradas de backfill reversíveis em `DREAMS.md`.
- **Reset** remove apenas essas entradas de diário de backfill marcadas de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas preparadas de curto prazo somente fundamentadas que vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte diário.

O que elas **não** fazem por conta própria:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não preparam automaticamente candidatos fundamentados no armazenamento ativo de promoção de curto prazo, a menos que você execute explicitamente o caminho preparado da CLI primeiro

Se quiser que o replay histórico fundamentado influencie a faixa normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso prepara candidatos duráveis fundamentados no armazenamento de dreaming de curto prazo, mantendo `DREAMS.md` como a superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout git e o doctor estiver executando de forma interativa, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados do Talk. A configuração pública atual de fala do Talk é `talk.provider` + `talk.providers.<provider>`, e a configuração de voz em tempo real é `talk.realtime.*`. O doctor reescreve formatos antigos de `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedor e reescreve seletores legados de tempo real no nível superior (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) em `talk.realtime`.

    Doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas de ferramenta curinga ou pertencentes a plugins. `tools.allow: ["*"]` corresponde apenas a ferramentas
    de plugins que realmente carregam; ele não ignora a lista de permissões exclusiva de plugins.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    Doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração que ele aplicou.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    A inicialização do Gateway recusa formatos de configuração legados e pede que você execute `openclaw doctor --fix`; ela não reescreve `openclaw.json` na inicialização. Migrações do armazenamento de jobs Cron também são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - remover `channels.webchat` e `gateway.webchat` retirados
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` no nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados → `talk.provider` + `talk.providers.<provider>`
    - seletores Talk em tempo real no nível superior legados (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` e `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` e `messages.tts.providers.microsoft`
    - campos de seleção de falante TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` e `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` e `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Para canais com `accounts` nomeadas, mas valores de canal de nível superior de conta única remanescentes, mover esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remover `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para timeouts lentos de provedor/modelo e mantenha o timeout do agente/execução acima desse valor quando a execução inteira precisar durar mais
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remover `browser.relayBindHost` (configuração legada de relay da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do Gateway também ignora provedores cujo `api` esteja definido como um valor de enum futuro ou desconhecido, em vez de falhar de forma fechada)
    - remover `plugins.entries.codex.config.codexDynamicToolsProfile`; o servidor de aplicativo Codex sempre mantém ferramentas de workspace nativas do Codex como nativas

    Os avisos do Doctor também incluem orientação de padrão de conta para canais com múltiplas contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o Doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o Doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `openclaw/plugin-sdk/llm`. Isso pode forçar modelos para a API errada ou zerar custos. O Doctor avisa para que você possa remover a substituição e restaurar o roteamento de API por modelo + custos.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão do Chrome MCP">
    Se a configuração do navegador ainda aponta para o caminho da extensão Chrome removido, o Doctor a normaliza para o modelo atual de anexação Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O Doctor também audita o caminho Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis de conexão automática padrão
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O Doctor não pode habilitar a configuração do lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/nó
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui se refere apenas aos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rotas do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de downloads e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, navegador remoto ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de OAuth TLS">
    Quando um perfil OAuth do OpenAI Codex está configurado, o Doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o Doctor imprime orientação de correção específica da plataforma. No macOS com Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo que o gateway esteja saudável.
  </Accordion>
  <Accordion title="2e. Substituições de provedor OAuth Codex">
    Se você adicionou anteriormente configurações legadas de transporte OpenAI em `models.providers.openai-codex`, elas podem sombrear o caminho integrado do provedor OAuth Codex que versões mais recentes usam automaticamente. O Doctor avisa quando vê essas configurações de transporte antigas junto com OAuth Codex para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições apenas de cabeçalho ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Reparo de rota Codex">
    O Doctor verifica refs de modelo `openai-codex/*` legadas. O roteamento nativo do harness Codex usa refs de modelo canônicas `openai/*`; turnos de agente OpenAI passam pelo harness do servidor de aplicativo Codex em vez do caminho do provedor OpenAI do OpenClaw.

    No modo `--fix` / `--repair`, o Doctor reescreve refs afetadas de agente padrão e por agente, incluindo modelos primários, fallbacks, modelos de geração de imagem/vídeo, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo de canal e estado de rota de sessão persistido obsoleto:

    - `openai-codex/gpt-*` se torna `openai/gpt-*`.
    - A intenção Codex se move para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo para refs de modelo de agente reparadas.
    - Configuração de runtime de agente inteiro obsoleta e pins de runtime de sessão persistidos são removidos porque a seleção de runtime tem escopo de provedor/modelo.
    - A política de runtime de provedor/modelo existente é preservada, a menos que a ref de modelo legada reparada precise de roteamento Codex para manter o caminho de autenticação antigo.
    - Listas de fallback de modelo existentes são preservadas com suas entradas legadas reescritas; configurações por modelo copiadas se movem da chave legada para a chave canônica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de fallback e pins de perfil de autenticação de sessão persistidos são reparados em todos os armazenamentos de sessão de agente descobertos.
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador externo ACP/acpx."

  </Accordion>
  <Accordion title="2g. Limpeza de rota de sessão">
    O Doctor também examina armazenamentos de sessão de agente descobertos em busca de estado de rota obsoleto criado automaticamente depois que você move modelos configurados ou runtime para fora de uma rota pertencente a um plugin, como Codex.

    `openclaw doctor --fix` pode limpar estado obsoleto criado automaticamente, como pins de modelo `modelOverrideSource: "auto"`, metadados de modelo de runtime, IDs de harness fixados, vinculações de sessão CLI e substituições automáticas de perfil de autenticação quando a rota proprietária deles não estiver mais configurada. Escolhas explícitas de modelo de usuário ou de sessão legada são relatadas para revisão manual e deixadas intactas; alterne-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais pretendida.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O Doctor pode migrar layouts mais antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o Doctor emitirá avisos quando deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente o diretório legado de sessões + agente na inicialização, para que histórico/autenticação/modelos cheguem ao caminho por agente sem execução manual do Doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores do Talk agora compara por igualdade estrutural, então diffs apenas de ordem de chaves não acionam mais alterações repetidas sem efeito de `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Migrações de manifestos de Plugin legados">
    O Doctor examina todos os manifestos de Plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e regravar o arquivo de manifesto no local. Essa migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações do armazenamento de Cron legado">
    O Doctor também verifica o armazenamento de tarefas Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de tarefas que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de Cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega de `provider` no payload → `delivery.channel` explícito
    - tarefas legadas de fallback de Webhook com `notify: true` → entrega explícita por Webhook a partir de `cron.webhook` quando definida; tarefas de anúncio mantêm a entrega por chat e recebem `delivery.completionDestination`. Quando `cron.webhook` não está definido, o marcador inerte de nível superior `notify` é removido para tarefas sem destino (a entrega existente, incluindo anúncios, é preservada), já que a entrega em tempo de execução nunca o lê

    O Gateway também saneia linhas de Cron malformadas no momento do carregamento para que tarefas válidas continuem em execução. Linhas brutas malformadas são copiadas para `jobs-quarantine.json` ao lado do armazenamento ativo antes de serem removidas de `jobs.json`; o Doctor relata linhas em quarentena para que você possa revisá-las ou repará-las manualmente.

    A inicialização do Gateway normaliza a projeção de tempo de execução e ignora o marcador de nível superior `notify`, mas deixa a configuração persistida de Cron para reparo pelo Doctor. Quando `cron.webhook` não está definido, o Doctor remove o marcador inerte de tarefas sem alvo de migração (`delivery.mode` nenhum/ausente, um alvo de Webhook inutilizável ou entrega existente de anúncio/chat), deixando a entrega existente intacta, para que execuções repetidas de `doctor --fix` não voltem a avisar sobre a mesma tarefa. Se `cron.webhook` estiver definido, mas não for uma URL HTTP(S) válida, o Doctor ainda avisa e deixa o marcador para que você possa corrigir a URL.

    No Linux, o Doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o Cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O Doctor examina todos os diretórios de sessão de agentes em busca de arquivos de bloqueio de gravação obsoletos — arquivos deixados para trás quando uma sessão saiu de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto, metadados de proprietário malformados, mais antigo que 30 minutos ou um PID ativo que pode ser comprovado como pertencente a um processo que não é do OpenClaw). No modo `--fix` / `--repair`, ele remove automaticamente bloqueios com proprietários mortos, órfãos, reciclados, antigos malformados ou que não sejam do OpenClaw. Bloqueios antigos que ainda pertencem a um processo OpenClaw ativo são relatados, mas mantidos no lugar para que o Doctor não interrompa um gravador de transcrição ativo.
  </Accordion>
  <Accordion title="3d. Reparo de ramificações de transcrição de sessão">
    O Doctor examina arquivos JSONL de sessão de agentes em busca do formato de ramificação duplicada criado pelo bug de regravação de transcrição de prompt de 2026.4.24: uma interação de usuário abandonada com contexto interno de tempo de execução do OpenClaw, além de uma ramificação irmã ativa contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o Doctor faz backup de cada arquivo afetado ao lado do original e regrava a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais interações duplicadas.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O Doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não pode recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de gravação; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com a nuvem no macOS**: avisa quando o estado resolve para iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória em SD ou eMMC pode ser mais lenta e desgastar mais rapidamente sob gravações de sessão e credenciais.
    - **Diretório de estado volátil no Linux**: avisa quando o estado resolve para `tmpfs` ou `ramfs`, porque sessões, credenciais, configuração e estado SQLite com seus arquivos auxiliares WAL/journal desaparecerão na reinicialização. Montagens Docker `overlay` não são sinalizadas intencionalmente porque suas camadas graváveis persistem entre reinicializações do host enquanto o contêiner permanece.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Múltiplos diretórios de estado**: avisa quando existem várias pastas `~/.openclaw` em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o Doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` pode ser lido por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade de autenticação de modelos (expiração de OAuth)">
    O Doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Prompts de atualização só aparecem ao executar interativamente (TTY); `--non-interactive` pula tentativas de atualização.

    Quando uma atualização de OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), o Doctor relata que a reautenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O Doctor também relata perfis de autenticação temporariamente inutilizáveis devido a:

    - pausas curtas (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de faturamento/crédito)

    Perfis OAuth legados do Codex cujos tokens ficam no macOS Keychain (onboarding mais antigo antes do layout de arquivo auxiliar) são reparados apenas pelo Doctor. Execute `openclaw doctor --fix` uma vez a partir de um terminal interativo para migrar tokens legados baseados no Keychain inline para `auth-profiles.json`; depois disso, interações incorporadas (Telegram, Cron, despacho de subagente) os resolvem como perfis OAuth canônicos da OpenAI.

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o Doctor valida a referência de modelo contra o catálogo e a lista de permissões e avisa quando ela não resolver ou for proibida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandbox está habilitado, o Doctor verifica imagens Docker e oferece criar ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugins">
    O Doctor remove o estado legado de preparação de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependência geradas obsoletas, diretórios antigos de estágio de instalação, resíduos locais de pacote de código anterior de reparo de dependências de Plugins agrupados e cópias gerenciadas de npm órfãs ou recuperadas de Plugins `@openclaw/*` agrupados que podem sombrear o manifesto agrupado atual. O Doctor também relinka o pacote `openclaw` do host em Plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que importações de tempo de execução locais ao pacote, como `openclaw/plugin-sdk/*`, continuem resolvendo após atualizações ou reparos de npm.

    O Doctor também pode reinstalar Plugins baixáveis ausentes quando a configuração faz referência a eles, mas o registro local de Plugins não consegue encontrá-los. Exemplos incluem `plugins.entries` materiais, configurações de canal/provedor/busca configuradas e runtimes de agentes configurados. Durante atualizações de pacote, o Doctor evita executar reparo de Plugin por gerenciador de pacotes enquanto o pacote principal está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um Plugin configurado ainda precisar de recuperação. A inicialização do Gateway e a recarga de configuração não executam gerenciadores de pacotes; instalações de Plugin permanecem trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O Doctor detecta serviços de Gateway legados (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço OpenClaw usando a porta atual do Gateway. Ele também pode examinar serviços adicionais parecidos com Gateway e imprimir dicas de limpeza. Serviços de Gateway OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras".

    No Linux, se o serviço de Gateway em nível de usuário estiver ausente, mas existir um serviço de Gateway OpenClaw em nível de sistema, o Doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor do sistema possuir o ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o Doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração em melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente pulada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivos e desvio de autenticação">
    O Doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

    O que ele relata:

    - solicitações pendentes de pareamento inicial
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos desviam da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo para a máquina atual que são anteriores a uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O Doctor não aprova automaticamente solicitações de pareamento nem rotaciona tokens de dispositivo automaticamente. Em vez disso, ele imprime os próximos passos exatos:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e reaprove um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento obrigatório": doctor agora distingue o pareamento inicial de upgrades pendentes de função/escopo e de desvio por token obsoleto/identidade de dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    Doctor emite avisos quando um provedor está aberto para DMs sem uma lista de permissões, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver em execução como um serviço de usuário do systemd, doctor garante que o linger esteja habilitado para que o gateway permaneça ativo após o logout.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, plugins e TaskFlows)">
    Doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status das Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas pela lista de permissões.
    - **Status dos plugins**: conta plugins habilitados/desabilitados/com erro; lista IDs de plugins para quaisquer erros; relata capacidades de plugins do pacote.
    - **Avisos de compatibilidade de plugins**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de plugins**: exibe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de plugins.
    - **Recuperação de TaskFlow**: exibe TaskFlows gerenciados suspeitos que precisam de inspeção manual ou cancelamento.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    Doctor verifica se os arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele relata, por arquivo, contagens de caracteres brutos vs. injetados, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão próximos do limite, doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse plugin: entradas `channels.<id>`, destinos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal não existe mais, mas a configuração ainda pede que o gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Autocompletar do shell">
    Doctor verifica se o autocompletar por tab está instalado para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de autocompletar dinâmico (`source <(openclaw completion ...)`), doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se o autocompletar está configurado no perfil, mas o arquivo de cache está ausente, doctor regenera o cache automaticamente.
    - Se nenhum autocompletar está configurado, doctor solicita a instalação (somente no modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    Doctor verifica a prontidão da autenticação por token local do gateway.

    - Se o modo de token precisa de um token e não existe nenhuma fonte de token, doctor oferece gerar um.
    - Se `gateway.auth.token` é gerenciado por SecretRef, mas está indisponível, doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo de SecretRef somente leitura dos comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais de bot configuradas quando disponíveis.
    - Se o token do bot do Telegram está configurado via SecretRef, mas indisponível no caminho do comando atual, doctor informa que a credencial está configurada, mas indisponível, e ignora a resolução automática em vez de falhar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    Doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece não estar íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    Doctor verifica se o provedor configurado de embeddings de busca de memória está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientação de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL reconhecida de modelo remoto/baixável. Se ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage` etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático legado**: trata `memorySearch.provider: "auto"` como OpenAI, verifica a prontidão da OpenAI, e `doctor --fix` o reescreve para `provider: "openai"`.

    Quando um resultado de sondagem do gateway em cache está disponível (o gateway estava íntegro no momento da verificação), doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. Doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status profundo da memória quando quiser uma verificação ao vivo do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o gateway estiver íntegro, doctor executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    Doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e atraso de reinicialização). Quando encontra uma incompatibilidade, ele recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita os prompts de reparo padrão.
    - `openclaw doctor --fix` aplica correções recomendadas sem prompts (`--repair` é um alias).
    - `openclaw doctor --fix --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém doctor somente leitura para o ciclo de vida do serviço do gateway. Ele ainda relata a integridade do serviço e executa reparos que não são de serviço, mas ignora instalação/início/reinício/bootstrap de serviço, reescritas de configuração do supervisor e limpeza de serviço legado porque um supervisor externo é dono desse ciclo de vida.
    - No Linux, doctor não reescreve metadados de comando/entrypoint enquanto a unidade systemd correspondente do gateway está ativa. Ele também ignora unidades extras inativas não legadas semelhantes a gateway durante a varredura de serviços duplicados, para que arquivos de serviço companheiros não criem ruído de limpeza.
    - Se a autenticação por token exige um token e `gateway.auth.token` é gerenciado por SecretRef, a instalação/reparo de serviço do doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço do supervisor.
    - Doctor detecta valores de ambiente de serviço gerenciados por `.env`/baseados em SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - Doctor detecta quando o comando de serviço ainda fixa um `--port` antigo após mudanças em `gateway.port` e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exige um token e o SecretRef de token configurado não está resolvido, doctor bloqueia o caminho de instalação/reparo com orientação acionável.
    - Se tanto `gateway.auth.token` quanto `gateway.auth.password` estão configurados e `gateway.auth.mode` não está definido, doctor bloqueia instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd no Linux, as verificações de desvio de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço de gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    Doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Boas práticas de runtime do Gateway">
    Doctor avisa quando o serviço do gateway executa em Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf` etc.). Canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. Doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que binários do sistema gerenciados pelo Homebrew continuem disponíveis enquanto Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alterem qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback inferidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem em disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    Doctor persiste quaisquer mudanças de configuração e carimba metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    Doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
