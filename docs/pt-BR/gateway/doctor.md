---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introdução de alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-12T08:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configuração/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Modos sem interface e de automação

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de reinicialização/serviço/sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica os reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Aplica também reparos agressivos (sobrescreve configurações personalizadas do supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de reinicialização/serviço/sandbox que exigem confirmação humana. Migrações de estado legado são executadas automaticamente quando detectadas.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Varre serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra o arquivo de configuração primeiro:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Integridade, UI e atualizações">
    - Atualização prévia opcional para instalações via git (somente interativa).
    - Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.

  </Accordion>
  <Accordion title="Configuração e migrações">
    - Normalização de configuração para valores legados.
    - Migração da configuração de Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração de navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição do provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento de OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de OAuth TLS para perfis OAuth do OpenAI Codex.
    - Avisos de lista de permissões de plugins/ferramentas quando `plugins.allow` é restritiva, mas a política de ferramentas ainda solicita curinga ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessões/diretório de agente/autenticação do WhatsApp).
    - Migração de chaves legadas do contrato de manifesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração de armazenamento de Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload no nível superior, payload `provider`, jobs de fallback de Webhook simples `notify: true`).
    - Limpeza de política de runtime legada de agente inteiro; a política de runtime de provedor/modelo é o seletor de rota ativo.
    - Limpeza de configuração obsoleta de plugins quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas a plugins são tratadas como configuração de contenção inerte e são preservadas.

  </Accordion>
  <Accordion title="Estado e integridade">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcritos de sessão para ramificações duplicadas de reescrita de prompt criadas por builds afetados de 2026.4.24.
    - Detecção de tombstone de recuperação por reinicialização de subagente travado, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada, para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcritos, diretório de estado).
    - Verificações de permissões do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelos: verifica expiração de OAuth, pode atualizar tokens próximos da expiração e relata estados de cooldown/desabilitado de auth-profile.
    - Detecção de diretório de workspace extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, serviços e supervisores">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateway extra.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canais (sondados a partir do Gateway em execução).
    - Verificações de permissão específicas de canal ficam em `openclaw channels capabilities`; por exemplo, permissões de canal de voz do Discord são auditadas com `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Verificações de responsividade do WhatsApp para integridade degradada do loop de eventos do Gateway com clientes TUI locais ainda em execução; `--fix` interrompe apenas clientes TUI locais verificados.
    - Reparo de rota do Codex para referências legadas de modelo `openai-codex/*` em modelos primários, fallbacks, substituições de Heartbeat/subagente/Compaction, hooks, substituições de modelo por canal e pins de rota de sessão; `--fix` as reescreve para `openai/*`, remove pins obsoletos de runtime de sessão/agente inteiro e deixa referências canônicas do agente OpenAI no harness Codex padrão.
    - Auditoria de configuração de supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza de ambiente de proxy embutido para serviços do Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de boas práticas de runtime do Gateway (Node versus Bun, caminhos de gerenciadores de versão).
    - Diagnóstico de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Autenticação, segurança e pareamento">
    - Avisos de segurança para políticas abertas de DM.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações SecretRef de token).
    - Detecção de problemas de pareamento de dispositivos (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, divergência de cache obsoleto de token de dispositivo local e divergência de autenticação de registros pareados).

  </Accordion>
  <Accordion title="Workspace e shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo ao limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata skills permitidas com bins, env, configuração ou requisitos de SO ausentes, e `--fix` pode desabilitar skills indisponíveis em `skills.entries`.
    - Verificação de status de conclusão de shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de busca de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Preenchimento retroativo e redefinição da UI de Dreams

A cena Dreams da Control UI inclui ações **Preencher retroativamente**, **Redefinir** e **Limpar fundamentados** para o fluxo de trabalho de dreaming fundamentado. Essas ações usam métodos RPC no estilo do Gateway doctor, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Preencher retroativamente** varre arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentado e grava entradas reversíveis de preenchimento retroativo em `DREAMS.md`.
- **Redefinir** remove de `DREAMS.md` apenas essas entradas marcadas de diário de preenchimento retroativo.
- **Limpar fundamentados** remove apenas entradas de curto prazo preparadas somente como fundamentadas que vieram de repetição histórica e ainda não acumularam recall ao vivo nem suporte diário.

O que elas **não** fazem por conta própria:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não preparam automaticamente candidatas fundamentadas no armazenamento de promoção de curto prazo ao vivo, a menos que você execute explicitamente o caminho preparado da CLI primeiro

Se quiser que a repetição histórica fundamentada influencie a via normal de promoção profunda, use o fluxo da CLI em vez disso:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso prepara candidatas duráveis fundamentadas no armazenamento de dreaming de curto prazo enquanto mantém `DREAMS.md` como superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Atualização opcional (instalações via git)">
    Se este for um checkout git e a ferramenta estiver sendo executada interativamente, ela oferece atualização (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Normalização de configuração">
    Se a configuração contém formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o schema atual.

    Isso inclui campos planos legados de Talk. A configuração pública atual de fala do Talk é `talk.provider` + `talk.providers.<provider>`, e a configuração de voz em tempo real é `talk.realtime.*`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` no mapa de provedores e reescreve seletores legados em nível superior de tempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) em `talk.realtime`.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas curinga ou de ferramentas pertencentes a plugins. `tools.allow: ["*"]` só corresponde a ferramentas
    de plugins que realmente carregam; isso não contorna a lista de permissões exclusiva de plugins. O doctor grava `plugins.bundledDiscovery: "compat"` para configurações legadas
    migradas de lista de permissões para preservar o comportamento existente de provedores empacotados e,
    em seguida, aponta para a configuração mais estrita `"allowlist"`.

  </Accordion>
  <Accordion title="2. Migrações de chaves de configuração legadas">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor vai:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

    A inicialização do Gateway recusa formatos de configuração legados e pede que você execute `openclaw doctor --fix`; ela não reescreve `openclaw.json` na inicialização. Migrações do armazenamento de jobs Cron também são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurações de canais configurados sem política de resposta visível → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` de nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legado → `talk.provider` + `talk.providers.<provider>`
    - seletores legados de Talk em tempo real de nível superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` e `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` e `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` e `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` e `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Para canais com `accounts` nomeadas, mas valores de canal de nível superior de conta única remanescentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; o Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para tempos limite lentos de provedor/modelo
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de retransmissão da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do gateway também ignora provedores cujo `api` esteja definido como um valor de enumeração futuro ou desconhecido, em vez de falhar de forma fechada)
    - remova `plugins.entries.codex.config.codexDynamicToolsProfile`; o servidor de app Codex sempre mantém nativas as ferramentas de workspace nativas do Codex

    Os avisos de diagnóstico também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o diagnóstico avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o diagnóstico avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. Substituições de provedor OpenCode">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@earendil-works/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O diagnóstico avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Migração do navegador e prontidão do Chrome MCP">
    Se a configuração do seu navegador ainda aponta para o caminho removido da extensão do Chrome, o diagnóstico a normaliza para o modelo atual de anexação Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O diagnóstico também audita o caminho Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O diagnóstico não pode habilitar a configuração no lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/nó
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. `existing-session` mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a fluxos Docker, sandbox, navegador remoto ou outros fluxos headless. Eles continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. Pré-requisitos de TLS do OAuth">
    Quando um perfil OpenAI Codex OAuth está configurado, o diagnóstico sonda o endpoint de autorização da OpenAI para verificar se a pilha local Node/OpenSSL TLS consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o diagnóstico imprime orientação de correção específica da plataforma. No macOS com um Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo se o gateway estiver íntegro.
  </Accordion>
  <Accordion title="2e. Substituições de provedor Codex OAuth">
    Se você adicionou anteriormente configurações legadas de transporte OpenAI em `models.providers.openai-codex`, elas podem ocultar o caminho integrado de provedor Codex OAuth que versões mais novas usam automaticamente. O diagnóstico avisa quando vê essas configurações antigas de transporte junto com Codex OAuth, para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições somente de cabeçalho continuam compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Reparo de rota Codex">
    O diagnóstico verifica refs de modelo `openai-codex/*` legadas. O roteamento nativo do harness Codex usa refs de modelo `openai/*` canônicas; turnos do agente OpenAI passam pelo harness do servidor de app Codex em vez do caminho OpenClaw PI OpenAI.

    No modo `--fix` / `--repair`, o diagnóstico reescreve refs afetadas de agente padrão e por agente, incluindo modelos primários, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo de canal e estado persistido obsoleto de rota de sessão:

    - `openai-codex/gpt-*` se torna `openai/gpt-*`.
    - A intenção Codex é movida para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo para refs de modelo de agente reparadas, para que perfis de autenticação `openai-codex:...` ainda possam ser selecionados depois que a ref de modelo se tornar `openai/*`.
    - Configuração obsoleta de runtime de agente inteiro e pins persistidos de runtime de sessão são removidos porque a seleção de runtime tem escopo de provedor/modelo.
    - A política existente de runtime de provedor/modelo é preservada, a menos que a ref de modelo legada reparada precise de roteamento Codex para manter o caminho antigo de autenticação.
    - Listas existentes de fallback de modelo são preservadas com suas entradas legadas reescritas; configurações por modelo copiadas são movidas da chave legada para a chave canônica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de fallback e pins de perfil de autenticação de sessões persistidas são reparados em todos os armazenamentos de sessão de agente descobertos.
    - `/codex ...` significa "controlar ou vincular uma conversa Codex nativa pelo chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador ACP/acpx externo."

  </Accordion>
  <Accordion title="2g. Limpeza de rota de sessão">
    O diagnóstico também varre armazenamentos de sessão de agente descobertos em busca de estado de rota obsoleto criado automaticamente depois que você move modelos configurados ou runtime para longe de uma rota pertencente a um plugin, como Codex.

    `openclaw doctor --fix` pode limpar estado obsoleto criado automaticamente, como pins de modelo `modelOverrideSource: "auto"`, metadados de modelo de runtime, IDs de harness fixados, vinculações de sessão CLI e substituições automáticas de perfil de autenticação quando a rota proprietária delas não está mais configurada. Escolhas explícitas do usuário ou legadas de modelo de sessão são relatadas para revisão manual e ficam intactas; troque-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais pretendida.

  </Accordion>
  <Accordion title="3. Migrações de estado legado (layout em disco)">
    O diagnóstico pode migrar layouts mais antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório de agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o diagnóstico emitirá avisos quando deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente as sessões legadas + o diretório de agente na inicialização, para que histórico/autenticação/modelos cheguem ao caminho por agente sem uma execução manual do diagnóstico. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores do Talk agora compara por igualdade estrutural, portanto diffs apenas de ordem de chaves não acionam mais alterações `doctor --fix` repetidas sem efeito.

  </Accordion>
  <Accordion title="3a. Migrações legadas de manifesto de plugin">
    O diagnóstico varre todos os manifestos de plugin instalados em busca de chaves de capacidade de nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no local. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Migrações legadas do armazenamento Cron">
    O diagnóstico também verifica o armazenamento de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de Cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload no nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega no nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` no payload → `delivery.channel` explícito
    - jobs simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente jobs `notify: true` quando pode fazer isso sem alterar o comportamento. Se um job combina o fallback legado de notificação com um modo de entrega não webhook existente, o doctor avisa e deixa esse job para revisão manual.

    No Linux, o doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueios de sessão">
    O doctor varre todos os diretórios de sessão de agentes em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão terminou de forma anormal. Para cada arquivo de bloqueio encontrado, ele informa: o caminho, PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto, mais antigo que 30 minutos ou um PID ativo que comprovadamente pertence a um processo que não é do OpenClaw). No modo `--fix` / `--repair`, ele remove automaticamente arquivos de bloqueio obsoletos; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação do transcript de sessão">
    O doctor varre arquivos JSONL de sessão de agentes em busca do formato de ramificação duplicado criado pelo bug de reescrita do transcript de prompt de 2026.4.24: um turno de usuário abandonado com contexto interno de runtime do OpenClaw mais um irmão ativo contendo o mesmo prompt de usuário visível. No modo `--fix` / `--repair`, o doctor faz backup de cada arquivo afetado ao lado do original e reescreve o transcript para a ramificação ativa, para que o histórico do gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o tronco cerebral operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que ele não consegue recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma incompatibilidade de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com a nuvem no macOS**: avisa quando o estado resolve para dentro do iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória baseada em SD ou eMMC pode ser mais lenta e se desgastar mais rápido sob escritas de sessões e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são obrigatórios para persistir histórico e evitar falhas `ENOENT`.
    - **Incompatibilidade de transcript**: avisa quando entradas de sessão recentes têm arquivos de transcript ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando o transcript principal tem apenas uma linha (o histórico não está acumulando).
    - **Múltiplos diretórios de estado**: avisa quando existem múltiplas pastas `~/.openclaw` em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` pode ser lido por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade da autenticação de modelo (expiração OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API Anthropic ou o caminho de token de configuração da Anthropic. Prompts de atualização só aparecem quando executado interativamente (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização OAuth falha permanentemente (por exemplo, `refresh_token_reused`, `invalid_grant` ou um provedor dizendo para você entrar novamente), o doctor informa que a reautenticação é obrigatória e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O doctor também informa perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência de modelo contra o catálogo e a allowlist e avisa quando ela não será resolvida ou não é permitida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está habilitado, o doctor verifica imagens Docker e oferece compilar ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O doctor remove o estado legado de staging de dependências de plugins gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependências geradas obsoletas, diretórios antigos de estágio de instalação, resíduos locais de pacote de código anterior de reparo de dependências de plugins empacotados e cópias npm gerenciadas órfãs ou recuperadas de plugins `@openclaw/*` empacotados que podem sombrear o manifesto empacotado atual. O doctor também relinka o pacote `openclaw` do host em plugins npm gerenciados que declaram `peerDependencies.openclaw`, para que imports de runtime locais do pacote, como `openclaw/plugin-sdk/*`, continuem sendo resolvidos após atualizações ou reparos npm.

    O doctor também pode reinstalar plugins baixáveis ausentes quando a configuração os referencia, mas o registro local de plugins não consegue encontrá-los. Exemplos incluem `plugins.entries` materiais, configurações de canal/provedor/pesquisa configuradas e runtimes de agentes configurados. Durante atualizações de pacote, o doctor evita executar reparo de plugins pelo gerenciador de pacotes enquanto o pacote principal está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um plugin configurado ainda precisar de recuperação. A inicialização do Gateway e o recarregamento de configuração não executam gerenciadores de pacotes; instalações de plugins continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O doctor detecta serviços de gateway legados (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço do OpenClaw usando a porta atual do gateway. Ele também pode varrer serviços extras semelhantes a gateway e imprimir dicas de limpeza. Serviços de gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras".

    No Linux, se o serviço de gateway em nível de usuário estiver ausente, mas existir um serviço de gateway OpenClaw em nível de sistema, o doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema controla o ciclo de vida do gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado legado do Matrix e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), essa verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivo e desvio de autenticação">
    O doctor agora inspeciona o estado de pareamento de dispositivos como parte da passagem normal de integridade.

    O que ele informa:

    - solicitações pendentes de pareamento pela primeira vez
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de incompatibilidade de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos desviam da baseline de pareamento aprovada
    - entradas de token de dispositivo armazenadas em cache local para a máquina atual que antecedem uma rotação de token no lado do gateway ou carregam metadados de escopo obsoletos

    O doctor não aprova automaticamente solicitações de pareamento nem rotaciona automaticamente tokens de dispositivo. Em vez disso, ele imprime as próximas etapas exatas:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - rotacione um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a brecha comum "já pareado, mas ainda recebendo pareamento obrigatório": agora o doctor distingue o pareamento pela primeira vez de upgrades pendentes de função/escopo e de desvios obsoletos de token/identidade de dispositivo.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O doctor emite avisos quando um provedor está aberto a DMs sem uma allowlist, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver executando como um serviço de usuário systemd, o doctor garante que linger esteja habilitado para que o gateway continue ativo após logout.
  </Accordion>
  <Accordion title="11. Status do workspace (skills, plugins e diretórios legados)">
    O doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
    - **Diretórios de workspace legados**: avisa quando `~/openclaw` ou outros diretórios de workspace legados existem ao lado do workspace atual.
    - **Status de Plugin**: conta plugins habilitados/desabilitados/com erro; lista IDs de plugins para quaisquer erros; informa capacidades de plugins do pacote.
    - **Avisos de compatibilidade de Plugin**: sinaliza plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros em tempo de carregamento emitidos pelo registro de plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O doctor verifica se arquivos de bootstrap do workspace (por exemplo, `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do orçamento de caracteres configurado. Ele informa, por arquivo, contagens de caracteres brutas vs. injetadas, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão próximos do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que referenciava esse plugin: entradas `channels.<id>`, alvos de Heartbeat que nomeavam o canal e overrides `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda pede que o gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Conclusão de shell">
    O doctor verifica se a conclusão por tabulação está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão lento de preenchimento dinâmico (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se o preenchimento estiver configurado no perfil, mas o arquivo de cache estiver ausente, o doctor regenera o cache automaticamente.
    - Se nenhum preenchimento estiver configurado, o doctor solicita a instalação dele (somente no modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token do gateway local.

    - Se o modo de token precisar de um token e nenhuma origem de token existir, o doctor oferece gerar um.
    - Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast em runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo SecretRef somente leitura dos comandos da família de status para reparos direcionados de configuração.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar as credenciais de bot configuradas quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada-mas-indisponível e ignora a resolução automática em vez de falhar ou relatar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinicialização">
    O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece não íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da busca de memória">
    O doctor verifica se o provedor de embeddings de busca de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: sonda se o binário `qmd` está disponível e pode ser iniciado. Caso contrário, imprime orientações de correção, incluindo o pacote npm e uma opção de caminho manual para o binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL de modelo remota/baixável reconhecida. Se estiver ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do gateway em cache está disponível (o gateway estava íntegro no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status de memória profundo quando quiser uma verificação ao vivo do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings em runtime.

  </Accordion>
  <Accordion title="14. Avisos de status de canal">
    Se o gateway estiver íntegro, o doctor executa uma sondagem de status de canal e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração instalada do supervisor (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências `network-online` do systemd e atraso de reinicialização). Quando encontra uma incompatibilidade, recomenda uma atualização e pode reescrever o arquivo de serviço/tarefa para os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
    - `openclaw doctor --yes` aceita as solicitações padrão de reparo.
    - `openclaw doctor --repair` aplica as correções recomendadas sem solicitações.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço do gateway. Ele ainda relata a integridade do serviço e executa reparos que não envolvem serviço, mas ignora instalação/início/reinicialização/bootstrap de serviço, reescritas de configuração do supervisor e limpeza de serviços legados porque um supervisor externo é proprietário desse ciclo de vida.
    - No Linux, o doctor não reescreve metadados de comando/entrypoint enquanto a unidade systemd correspondente do gateway estiver ativa. Ele também ignora unidades extras inativas não legadas semelhantes ao gateway durante a varredura de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo do serviço pelo doctor valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço do supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/baseados em SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows incorporaram inline e reescreve os metadados do serviço para que esses valores sejam carregados da origem de runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa um `--port` antigo após mudanças em `gateway.port` e reescreve os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd do Linux, as verificações de desvio de token do doctor agora incluem origens `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Os reparos de serviço do doctor se recusam a reescrever, parar ou reiniciar um serviço de gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma reescrita completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do gateway (padrão `18789`) e relata causas prováveis (gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Práticas recomendadas de runtime do Gateway">
    O doctor avisa quando o serviço do gateway roda no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, para que binários de sistema gerenciados pelo Homebrew permaneçam disponíveis enquanto Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alterem qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios de fallback estimados de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem em disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O doctor persiste quaisquer mudanças de configuração e carimba metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionado

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
