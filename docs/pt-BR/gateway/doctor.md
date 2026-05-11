---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzindo alterações incompatíveis na configuração
sidebarTitle: Doctor
summary: 'Comando doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Diagnóstico
x-i18n:
    generated_at: "2026-05-11T20:29:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige configuração/estado obsoletos, verifica a integridade e fornece etapas de reparo acionáveis.

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

    Aceita padrões sem solicitar confirmação (incluindo etapas de reinicialização/serviço/reparo de sandbox quando aplicável).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Aplica reparos recomendados sem solicitar confirmação (reparos + reinicializações quando seguro).

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

    Verifica serviços do sistema em busca de instalações extras do Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Se quiser revisar as alterações antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Atualização opcional antes da execução para instalações por git (somente interativo).
    - Verificação de atualização do protocolo da UI (reconstrói a UI de Controle quando o esquema do protocolo é mais novo).
    - Verificação de integridade + prompt de reinicialização.
    - Resumo de status de Skills (elegíveis/ausentes/bloqueadas) e status de plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalização de configuração para valores legados.
    - Migração da configuração de Talk de campos planos legados `talk.*` para `talk.provider` + `talk.providers.<provider>`.
    - Verificações de migração do navegador para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
    - Avisos de substituição de provedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Avisos de sombreamento do OAuth do Codex (`models.providers.openai-codex`).
    - Verificação de pré-requisitos de TLS do OAuth para perfis de OAuth do OpenAI Codex.
    - Avisos de lista de permissões de Plugin/ferramenta quando `plugins.allow` é restritivo, mas a política de ferramentas ainda solicita curinga ou ferramentas pertencentes a plugins.
    - Migração de estado legado em disco (sessões/diretório do agente/autenticação do WhatsApp).
    - Migração de chaves legadas do contrato de manifesto de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migração do armazenamento Cron legado (`jobId`, `schedule.cron`, campos de entrega/payload de nível superior, payload `provider`, jobs fallback simples de webhook `notify: true`).
    - Limpeza da política de runtime legada do agente inteiro; a política de runtime de provedor/modelo é o seletor de rota ativo.
    - Limpeza de configuração obsoleta de plugin quando plugins estão habilitados; quando `plugins.enabled=false`, referências obsoletas de plugin são tratadas como configuração de contenção inerte e são preservadas.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspeção de arquivos de bloqueio de sessão e limpeza de bloqueios obsoletos.
    - Reparo de transcrições de sessão para ramificações duplicadas de reescrita de prompt criadas por builds afetadas de 2026.4.24.
    - Detecção de tombstone de recuperação de reinicialização de subagente travado, com suporte a `--fix` para limpar flags obsoletas de recuperação abortada para que a inicialização não continue tratando o filho como abortado por reinicialização.
    - Verificações de integridade de estado e permissões (sessões, transcrições, diretório de estado).
    - Verificações de permissões do arquivo de configuração (chmod 600) ao executar localmente.
    - Integridade de autenticação de modelos: verifica expiração do OAuth, pode atualizar tokens próximos da expiração e relata estados de cooldown/desabilitado de perfis de autenticação.
    - Detecção de diretório de workspace extra (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Reparo de imagem de sandbox quando o sandboxing está habilitado.
    - Migração de serviço legado e detecção de Gateways extras.
    - Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
    - Verificações de runtime do Gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
    - Avisos de status de canal (sondados a partir do Gateway em execução).
    - Verificações de permissões específicas de canal ficam em `openclaw channels capabilities`; por exemplo, permissões de canal de voz do Discord são auditadas com `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Verificações de responsividade do WhatsApp para integridade degradada do loop de eventos do Gateway com clientes TUI locais ainda em execução; `--fix` para somente clientes TUI locais verificados.
    - Reparo de rotas do Codex para refs de modelo legadas `openai-codex/*` em modelos primários, fallbacks, substituições de heartbeat/subagente/compaction, hooks, substituições de modelo de canal e pins de rota de sessão; `--fix` as reescreve para `openai/*`, remove pins obsoletos de runtime de sessão/agente inteiro e mantém refs canônicas do agente OpenAI no harness Codex padrão.
    - Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
    - Limpeza do ambiente de proxy embutido para serviços do Gateway que capturaram valores de shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` durante a instalação ou atualização.
    - Verificações de boas práticas do runtime do Gateway (Node vs Bun, caminhos de gerenciadores de versão).
    - Diagnósticos de colisão de porta do Gateway (padrão `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Avisos de segurança para políticas abertas de DM.
    - Verificações de autenticação do Gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações de SecretRef de token).
    - Detecção de problemas de pareamento de dispositivos (solicitações pendentes de primeiro pareamento, upgrades pendentes de função/escopo, desvio obsoleto do cache local de token de dispositivo e desvio de autenticação de registro pareado).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Verificação de linger do systemd no Linux.
    - Verificação de tamanho do arquivo de bootstrap do workspace (avisos de truncamento/próximo do limite para arquivos de contexto).
    - Verificação de prontidão de Skills para o agente padrão; relata Skills permitidas com binários, env, configuração ou requisitos de SO ausentes, e `--fix` pode desabilitar Skills indisponíveis em `skills.entries`.
    - Verificação de status de preenchimento automático do shell e instalação/upgrade automático.
    - Verificação de prontidão do provedor de embeddings de pesquisa de memória (modelo local, chave de API remota ou binário QMD).
    - Verificações de instalação a partir do código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
    - Grava configuração atualizada + metadados do assistente.

  </Accordion>
</AccordionGroup>

## Preenchimento retroativo e redefinição da UI de Dreams

A cena Dreams da UI de Controle inclui ações **Backfill**, **Reset** e **Clear Grounded** para o fluxo de trabalho de dreaming fundamentado. Essas ações usam métodos RPC no estilo doctor do gateway, mas **não** fazem parte do reparo/migração da CLI `openclaw doctor`.

O que elas fazem:

- **Backfill** verifica arquivos históricos `memory/YYYY-MM-DD.md` no workspace ativo, executa a passagem de diário REM fundamentado e grava entradas reversíveis de preenchimento retroativo em `DREAMS.md`.
- **Reset** remove apenas essas entradas marcadas de diário de preenchimento retroativo de `DREAMS.md`.
- **Clear Grounded** remove apenas entradas temporárias somente fundamentadas e em estágio que vieram de replay histórico e ainda não acumularam recall ao vivo ou suporte diário.

O que elas **não** fazem por si só:

- elas não editam `MEMORY.md`
- elas não executam migrações completas do doctor
- elas não colocam automaticamente candidatos fundamentados em estágio no armazenamento ativo de promoção de curto prazo, a menos que você execute explicitamente primeiro o caminho da CLI em estágio

Se quiser que o replay histórico fundamentado influencie a faixa normal de promoção profunda, use o fluxo da CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Isso coloca candidatos duráveis fundamentados no armazenamento de dreaming de curto prazo, mantendo `DREAMS.md` como superfície de revisão.

## Comportamento detalhado e justificativa

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Se este for um checkout git e o doctor estiver em execução interativa, ele oferece atualizar (fetch/rebase/build) antes de executar o doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Se a configuração contiver formatos de valores legados (por exemplo, `messages.ackReaction` sem uma substituição específica de canal), o doctor os normaliza para o esquema atual.

    Isso inclui campos planos legados de Talk. A configuração pública atual de fala do Talk é `talk.provider` + `talk.providers.<provider>`, e a configuração de voz em tempo real é `talk.realtime.*`. O doctor reescreve formatos antigos `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` para o mapa de provedores, e reescreve seletores legados de nível superior em tempo real (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) para `talk.realtime`.

    O doctor também avisa quando `plugins.allow` não está vazio e a política de ferramentas usa
    entradas curinga ou de ferramentas pertencentes a plugins. `tools.allow: ["*"]` só corresponde a ferramentas
    de plugins que realmente carregam; ele não ignora a lista de permissões exclusiva de plugin.
    O doctor grava `plugins.bundledDiscovery: "compat"` para configurações migradas
    de lista de permissões legada para preservar o comportamento existente de provedores empacotados e
    então aponta para a configuração mais restrita `"allowlist"`.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem que você execute `openclaw doctor`.

    O doctor irá:

    - Explicar quais chaves legadas foram encontradas.
    - Mostrar a migração aplicada.
    - Reescrever `~/.openclaw/openclaw.json` com o esquema atualizado.

    A inicialização do Gateway recusa formatos de configuração legados e pede que você execute `openclaw doctor --fix`; ela não reescreve `openclaw.json` na inicialização. Migrações do armazenamento de jobs Cron também são tratadas por `openclaw doctor --fix`.

    Migrações atuais:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - configurações de canal configurado sem política de resposta visível → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` no nível superior
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legados → `talk.provider` + `talk.providers.<provider>`
    - seletores Talk em tempo real legados no nível superior (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Para canais com `accounts` nomeadas, mas valores de canal de conta única no nível superior ainda presentes, mova esses valores com escopo de conta para a conta promovida escolhida para esse canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente existente)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (ferramentas/elevado/exec/sandbox/subagentes)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - remova `agents.defaults.llm`; use `models.providers.<id>.timeoutSeconds` para tempos limite lentos de provedor/modelo
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - remova `browser.relayBindHost` (configuração legada de retransmissão da extensão)
    - `models.providers.*.api: "openai"` legado → `"openai-completions"` (a inicialização do Gateway também ignora provedores cujo `api` esteja definido como um valor de enum futuro ou desconhecido, em vez de falhar fechado)
    - remova `plugins.entries.codex.config.codexDynamicToolsProfile`; o servidor de aplicativo do Codex sempre mantém as ferramentas de workspace nativas do Codex como nativas

    Os avisos do doctor também incluem orientação de conta padrão para canais com várias contas:

    - Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
    - Se `channels.<channel>.defaultAccount` estiver definido como um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go` manualmente, isso substitui o catálogo OpenCode integrado de `@earendil-works/pi-ai`. Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você possa remover a substituição e restaurar o roteamento de API + custos por modelo.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Se a sua configuração do navegador ainda aponta para o caminho removido da extensão do Chrome, o doctor a normaliza para o modelo atual de anexação Chrome MCP local ao host:

    - `browser.profiles.*.driver: "extension"` se torna `"existing-session"`
    - `browser.relayBindHost` é removido

    O doctor também audita o caminho Chrome MCP local ao host quando você usa `defaultProfile: "user"` ou um perfil `existing-session` configurado:

    - verifica se o Google Chrome está instalado no mesmo host para perfis padrão de conexão automática
    - verifica a versão detectada do Chrome e avisa quando ela está abaixo do Chrome 144
    - lembra você de habilitar a depuração remota na página de inspeção do navegador (por exemplo, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

    O doctor não pode habilitar a configuração no lado do Chrome para você. O Chrome MCP local ao host ainda exige:

    - um navegador baseado em Chromium 144+ no host do gateway/nó
    - o navegador em execução localmente
    - depuração remota habilitada nesse navegador
    - aprovação do primeiro prompt de consentimento de anexação no navegador

    A prontidão aqui trata apenas dos pré-requisitos de anexação local. Existing-session mantém os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação de PDF, interceptação de download e ações em lote ainda exigem um navegador gerenciado ou um perfil CDP bruto.

    Esta verificação **não** se aplica a Docker, sandbox, remote-browser ou outros fluxos headless. Esses continuam usando CDP bruto.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de autorização da OpenAI para verificar se a pilha TLS local do Node/OpenSSL consegue validar a cadeia de certificados. Se a sondagem falhar com um erro de certificado (por exemplo, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado), o doctor imprime orientação de correção específica da plataforma. No macOS com Node do Homebrew, a correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sondagem é executada mesmo se o Gateway estiver íntegro.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Se você adicionou anteriormente configurações legadas de transporte da OpenAI em `models.providers.openai-codex`, elas podem sombrear o caminho do provedor OAuth do Codex integrado que versões mais novas usam automaticamente. O doctor avisa quando vê essas configurações antigas de transporte junto com Codex OAuth, para que você possa remover ou reescrever a substituição de transporte obsoleta e recuperar o comportamento integrado de roteamento/fallback. Proxies personalizados e substituições apenas de cabeçalho ainda são compatíveis e não acionam este aviso.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    O doctor verifica refs de modelo `openai-codex/*` legadas. O roteamento nativo do harness do Codex usa refs de modelo canônicas `openai/*`; turnos de agente da OpenAI passam pelo harness do servidor de aplicativo do Codex em vez do caminho OpenAI do OpenClaw PI.

    No modo `--fix` / `--repair`, o doctor reescreve refs afetadas de agente padrão e por agente, incluindo modelos primários, fallbacks, substituições de heartbeat/subagente/Compaction, hooks, substituições de modelo de canal e estado de rota de sessão persistido obsoleto:

    - `openai-codex/gpt-*` se torna `openai/gpt-*`.
    - A intenção do Codex se move para entradas `agentRuntime.id: "codex"` com escopo de provedor/modelo para refs de modelo de agente reparadas, para que perfis de autenticação `openai-codex:...` ainda possam ser selecionados depois que a ref de modelo se torna `openai/*`.
    - Configuração obsoleta de runtime de agente inteiro e pins de runtime de sessão persistidos são removidos porque a seleção de runtime tem escopo de provedor/modelo.
    - A política de runtime de provedor/modelo existente é preservada, a menos que a ref de modelo legada reparada precise do roteamento Codex para manter o caminho antigo de autenticação.
    - Listas de fallback de modelo existentes são preservadas com suas entradas legadas reescritas; configurações copiadas por modelo se movem da chave legada para a chave canônica `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, avisos de fallback e pins de perfil de autenticação de sessões persistidas são reparados em todos os armazenamentos de sessão de agente descobertos.
    - `/codex ...` significa "controlar ou vincular uma conversa nativa do Codex a partir do chat."
    - `/acp ...` ou `runtime: "acp"` significa "usar o adaptador ACP/acpx externo."

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    O doctor também verifica armazenamentos de sessão de agente descobertos em busca de estado de rota criado automaticamente e obsoleto depois que você move modelos configurados ou runtime para longe de uma rota pertencente a Plugin, como Codex.

    `openclaw doctor --fix` pode limpar estado obsoleto criado automaticamente, como pins de modelo `modelOverrideSource: "auto"`, metadados de modelo de runtime, IDs de harness fixados, vínculos de sessão da CLI e substituições automáticas de perfil de autenticação quando a rota proprietária não está mais configurada. Escolhas explícitas de usuário ou de modelo de sessão legado são relatadas para revisão manual e deixadas intactas; troque-as com `/model ...`, `/new` ou redefina a sessão quando essa rota não for mais pretendida.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    O doctor pode migrar layouts antigos em disco para a estrutura atual:

    - Armazenamento de sessões + transcrições:
      - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
    - Diretório do agente:
      - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
    - Estado de autenticação do WhatsApp (Baileys):
      - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
      - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID da conta padrão: `default`)

    Essas migrações são de melhor esforço e idempotentes; o doctor emitirá avisos quando deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também migra automaticamente as sessões legadas + diretório do agente na inicialização, para que histórico/autenticação/modelos cheguem ao caminho por agente sem uma execução manual do doctor. A autenticação do WhatsApp é intencionalmente migrada apenas via `openclaw doctor`. A normalização de provedor/mapa de provedores do Talk agora compara por igualdade estrutural, então diffs apenas de ordem de chave não acionam mais alterações `doctor --fix` repetidas sem efeito.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    O doctor verifica todos os manifestos de Plugin instalados em busca de chaves de capacidade obsoletas no nível superior (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts` e reescrever o arquivo de manifesto no lugar. Esta migração é idempotente; se a chave `contracts` já tiver os mesmos valores, a chave legada será removida sem duplicar os dados.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    O doctor também verifica o armazenamento de jobs Cron (`~/.openclaw/cron/jobs.json` por padrão, ou `cron.store` quando substituído) em busca de formatos antigos de job que o agendador ainda aceita por compatibilidade.

    As limpezas atuais de Cron incluem:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
    - campos de entrega de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - aliases de entrega `provider` do payload → `delivery.channel` explícito
    - jobs simples legados de fallback de Webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

    O doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem alterar o comportamento. Se um job combina fallback legado de notificação com um modo de entrega não Webhook existente, o doctor avisa e deixa esse job para revisão manual.

    No Linux, o doctor também avisa quando o crontab do usuário ainda invoca o legado `~/.openclaw/bin/ensure-whatsapp.sh`. Esse script local do host não é mantido pelo OpenClaw atual e pode gravar mensagens falsas de `Gateway inactive` em `~/.openclaw/logs/whatsapp-health.log` quando o Cron não consegue alcançar o barramento de usuário do systemd. Remova a entrada obsoleta do crontab com `crontab -e`; use `openclaw channels status --probe`, `openclaw doctor` e `openclaw gateway status` para as verificações de integridade atuais.

  </Accordion>
  <Accordion title="3c. Limpeza de bloqueio de sessão">
    O doctor examina todos os diretórios de sessão de agentes em busca de arquivos de bloqueio de escrita obsoletos — arquivos deixados para trás quando uma sessão saiu de forma anormal. Para cada arquivo de bloqueio encontrado, ele relata: o caminho, PID, se o PID ainda está ativo, a idade do bloqueio e se ele é considerado obsoleto (PID morto, mais antigo que 30 minutos ou um PID ativo que pode ser comprovado como pertencente a um processo que não é do OpenClaw). No modo `--fix` / `--repair`, ele remove automaticamente arquivos de bloqueio obsoletos; caso contrário, imprime uma observação e instrui você a executar novamente com `--fix`.
  </Accordion>
  <Accordion title="3d. Reparo de ramificação de transcrição de sessão">
    O doctor examina arquivos JSONL de sessão de agentes em busca do formato de ramificação duplicada criado pelo bug de reescrita de transcrição de prompt de 2026.4.24: um turno de usuário abandonado com contexto de runtime interno do OpenClaw, mais um irmão ativo contendo o mesmo prompt visível do usuário. No modo `--fix` / `--repair`, o doctor faz backup de cada arquivo afetado ao lado do original e reescreve a transcrição para a ramificação ativa, para que o histórico do Gateway e os leitores de memória não vejam mais turnos duplicados.
  </Accordion>
  <Accordion title="4. Verificações de integridade de estado (persistência de sessão, roteamento e segurança)">
    O diretório de estado é o centro operacional. Se ele desaparecer, você perde sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

    O doctor verifica:

    - **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar o diretório e lembra que não pode recuperar dados ausentes.
    - **Permissões do diretório de estado**: verifica a capacidade de escrita; oferece reparar permissões (e emite uma dica de `chown` quando uma divergência de proprietário/grupo é detectada).
    - **Diretório de estado sincronizado com nuvem no macOS**: avisa quando o estado resolve sob iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou `~/Library/CloudStorage/...`, porque caminhos com sincronização podem causar E/S mais lenta e corridas de bloqueio/sincronização.
    - **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado resolve para uma origem de montagem `mmcblk*`, porque E/S aleatória em SD ou eMMC pode ser mais lenta e se desgastar mais rápido sob escritas de sessão e credenciais.
    - **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessões são necessários para persistir o histórico e evitar falhas `ENOENT`.
    - **Divergência de transcrição**: avisa quando entradas de sessão recentes têm arquivos de transcrição ausentes.
    - **Sessão principal "JSONL de 1 linha"**: sinaliza quando a transcrição principal tem apenas uma linha (o histórico não está acumulando).
    - **Vários diretórios de estado**: avisa quando várias pastas `~/.openclaw` existem em diretórios home ou quando `OPENCLAW_STATE_DIR` aponta para outro lugar (o histórico pode se dividir entre instalações).
    - **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo no host remoto (o estado fica lá).
    - **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` é legível por grupo/todos e oferece restringir para `600`.

  </Accordion>
  <Accordion title="5. Integridade de autenticação de modelos (expiração de OAuth)">
    O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão expirando/expirados e pode atualizá-los quando for seguro. Se o perfil OAuth/token da Anthropic estiver obsoleto, ele sugere uma chave de API da Anthropic ou o caminho de token de configuração da Anthropic. Prompts de atualização só aparecem ao executar interativamente (TTY); `--non-interactive` ignora tentativas de atualização.

    Quando uma atualização de OAuth falha permanentemente (por exemplo `refresh_token_reused`, `invalid_grant` ou um provedor instruindo você a fazer login novamente), o doctor relata que uma nova autenticação é necessária e imprime o comando exato `openclaw models auth login --provider ...` a ser executado.

    O doctor também relata perfis de autenticação que estão temporariamente inutilizáveis devido a:

    - cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
    - desativações mais longas (falhas de cobrança/crédito)

  </Accordion>
  <Accordion title="6. Validação de modelo de hooks">
    Se `hooks.gmail.model` estiver definido, o doctor valida a referência do modelo contra o catálogo e a lista de permissões e avisa quando ela não resolver ou for proibida.
  </Accordion>
  <Accordion title="7. Reparo de imagem de sandbox">
    Quando o sandboxing está habilitado, o doctor verifica imagens Docker e oferece construir ou alternar para nomes legados se a imagem atual estiver ausente.
  </Accordion>
  <Accordion title="7b. Limpeza de instalação de Plugin">
    O doctor remove o estado legado de preparação de dependências de Plugin gerado pelo OpenClaw no modo `openclaw doctor --fix` / `openclaw doctor --repair`. Isso cobre raízes de dependência geradas obsoletas, diretórios antigos de estágio de instalação, resíduos locais de pacote de código anterior de reparo de dependências de Plugins empacotados e cópias npm gerenciadas órfãs ou recuperadas de Plugins `@openclaw/*` empacotados que podem sombrear o manifesto empacotado atual.

    O doctor também pode reinstalar Plugins baixáveis ausentes quando a configuração faz referência a eles, mas o registro local de Plugins não consegue encontrá-los. Exemplos incluem `plugins.entries` materiais, configurações de canal/provedor/pesquisa configuradas e runtimes de agentes configurados. Durante atualizações de pacote, o doctor evita executar reparo de Plugin por gerenciador de pacotes enquanto o pacote principal está sendo trocado; execute `openclaw doctor --fix` novamente após a atualização se um Plugin configurado ainda precisar de recuperação. A inicialização do Gateway e o recarregamento de configuração não executam gerenciadores de pacotes; instalações de Plugins continuam sendo trabalho explícito de doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrações de serviço do Gateway e dicas de limpeza">
    O doctor detecta serviços de Gateway legados (launchd/systemd/schtasks) e oferece removê-los e instalar o serviço do OpenClaw usando a porta atual do Gateway. Ele também pode procurar serviços extras semelhantes ao Gateway e imprimir dicas de limpeza. Serviços de Gateway do OpenClaw nomeados por perfil são considerados de primeira classe e não são sinalizados como "extras."

    No Linux, se o serviço de Gateway em nível de usuário estiver ausente, mas existir um serviço de Gateway do OpenClaw em nível de sistema, o doctor não instala automaticamente um segundo serviço em nível de usuário. Inspecione com `openclaw gateway status --deep` ou `openclaw doctor --deep`, depois remova a duplicata ou defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando um supervisor de sistema for responsável pelo ciclo de vida do Gateway.

  </Accordion>
  <Accordion title="8b. Migração de inicialização do Matrix">
    Quando uma conta de canal Matrix tem uma migração de estado legado pendente ou acionável, o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então executa as etapas de migração de melhor esforço: migração de estado Matrix legado e preparação de estado criptografado legado. Ambas as etapas não são fatais; erros são registrados e a inicialização continua. No modo somente leitura (`openclaw doctor` sem `--fix`), esta verificação é totalmente ignorada.
  </Accordion>
  <Accordion title="8c. Pareamento de dispositivos e desvio de autenticação">
    O doctor agora inspeciona o estado de pareamento de dispositivos como parte da verificação normal de integridade.

    O que ele relata:

    - solicitações pendentes de primeiro pareamento
    - upgrades de função pendentes para dispositivos já pareados
    - upgrades de escopo pendentes para dispositivos já pareados
    - reparos de divergência de chave pública em que o id do dispositivo ainda corresponde, mas a identidade do dispositivo não corresponde mais ao registro aprovado
    - registros pareados sem um token ativo para uma função aprovada
    - tokens pareados cujos escopos se desviam da linha de base de pareamento aprovada
    - entradas locais em cache de token de dispositivo da máquina atual que antecedem uma rotação de token no lado do Gateway ou carregam metadados de escopo obsoletos

    O doctor não aprova automaticamente solicitações de pareamento nem faz rotação automática de tokens de dispositivo. Ele imprime os próximos passos exatos:

    - inspecione solicitações pendentes com `openclaw devices list`
    - aprove a solicitação exata com `openclaw devices approve <requestId>`
    - gere um token novo com `openclaw devices rotate --device <deviceId> --role <role>`
    - remova e aprove novamente um registro obsoleto com `openclaw devices remove <deviceId>`

    Isso fecha a lacuna comum de "já pareado, mas ainda recebendo pareamento necessário": o doctor agora distingue o primeiro pareamento de upgrades pendentes de função/escopo e de desvio de token/identidade de dispositivo obsoleto.

  </Accordion>
  <Accordion title="9. Avisos de segurança">
    O doctor emite avisos quando um provedor está aberto a DMs sem uma lista de permissões, ou quando uma política está configurada de forma perigosa.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Se estiver executando como um serviço de usuário systemd, o doctor garante que linger esteja habilitado para que o Gateway permaneça ativo após logout.
  </Accordion>
  <Accordion title="11. Status do workspace (Skills, Plugins e diretórios legados)">
    O doctor imprime um resumo do estado do workspace para o agente padrão:

    - **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por lista de permissões.
    - **Diretórios de workspace legados**: avisa quando `~/openclaw` ou outros diretórios de workspace legados existem junto ao workspace atual.
    - **Status de Plugin**: conta Plugins habilitados/desabilitados/com erro; lista IDs de Plugin para quaisquer erros; relata capacidades de Plugins empacotados.
    - **Avisos de compatibilidade de Plugin**: sinaliza Plugins que têm problemas de compatibilidade com o runtime atual.
    - **Diagnósticos de Plugin**: expõe quaisquer avisos ou erros de tempo de carregamento emitidos pelo registro de Plugins.

  </Accordion>
  <Accordion title="11b. Tamanho do arquivo de bootstrap">
    O doctor verifica se os arquivos de bootstrap do workspace (por exemplo `AGENTS.md`, `CLAUDE.md` ou outros arquivos de contexto injetados) estão perto ou acima do orçamento de caracteres configurado. Ele relata contagens de caracteres brutos vs. injetados por arquivo, porcentagem de truncamento, causa do truncamento (`max/file` ou `max/total`) e o total de caracteres injetados como fração do orçamento total. Quando arquivos são truncados ou estão perto do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars` e `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Limpeza de Plugin de canal obsoleto">
    Quando `openclaw doctor --fix` remove um Plugin de canal ausente, ele também remove a configuração pendente com escopo de canal que fazia referência a esse Plugin: entradas `channels.<id>`, alvos de Heartbeat que nomeavam o canal e substituições `agents.*.models["<channel>/*"]`. Isso evita loops de inicialização do Gateway em que o runtime do canal desapareceu, mas a configuração ainda solicita que o Gateway se vincule a ele.
  </Accordion>
  <Accordion title="11c. Compleção de shell">
    O doctor verifica se a compleção por tab está instalada para o shell atual (zsh, bash, fish ou PowerShell):

    - Se o perfil do shell usa um padrão de compleção dinâmica lento (`source <(openclaw completion ...)`), o doctor o atualiza para a variante mais rápida de arquivo em cache.
    - Se a compleção estiver configurada no perfil, mas o arquivo de cache estiver ausente, o doctor regenera o cache automaticamente.
    - Se nenhuma compleção estiver configurada, o doctor solicita instalá-la (somente modo interativo; ignorado com `--non-interactive`).

    Execute `openclaw completion --write-state` para regenerar o cache manualmente.

  </Accordion>
  <Accordion title="12. Verificações de autenticação do Gateway (token local)">
    O doctor verifica a prontidão da autenticação por token local do Gateway.

    - Se o modo de token precisar de um token e não houver nenhuma fonte de token, o doctor oferece gerar um.
    - Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o substitui por texto simples.
    - `openclaw doctor --generate-gateway-token` força a geração somente quando nenhum SecretRef de token está configurado.

  </Accordion>
  <Accordion title="12b. Reparos somente leitura cientes de SecretRef">
    Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento fail-fast do runtime.

    - `openclaw doctor --fix` agora usa o mesmo modelo de resumo somente leitura de SecretRef dos comandos da família de status para reparos de configuração direcionados.
    - Exemplo: o reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar as credenciais configuradas do bot quando disponíveis.
    - Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada, mas indisponível, e pula a resolução automática em vez de travar ou informar incorretamente que o token está ausente.

  </Accordion>
  <Accordion title="13. Verificação de integridade do Gateway + reinício">
    O doctor executa uma verificação de integridade e oferece reiniciar o Gateway quando ele parece não estar íntegro.
  </Accordion>
  <Accordion title="13b. Prontidão da pesquisa de memória">
    O doctor verifica se o provedor de embeddings de pesquisa de memória configurado está pronto para o agente padrão. O comportamento depende do backend e do provedor configurados:

    - **Backend QMD**: verifica se o binário `qmd` está disponível e pode ser iniciado. Se não estiver, imprime orientações de correção incluindo o pacote npm e uma opção de caminho manual do binário.
    - **Provedor local explícito**: verifica se há um arquivo de modelo local ou uma URL reconhecida de modelo remoto/baixável. Se estiver ausente, sugere mudar para um provedor remoto.
    - **Provedor remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está presente no ambiente ou no armazenamento de autenticação. Imprime dicas de correção acionáveis se estiver ausente.
    - **Provedor automático**: verifica primeiro a disponibilidade do modelo local e depois tenta cada provedor remoto na ordem de seleção automática.

    Quando um resultado de sondagem do Gateway em cache está disponível (o Gateway estava íntegro no momento da verificação), o doctor cruza seu resultado com a configuração visível pela CLI e observa qualquer discrepância. O doctor não inicia um novo ping de embedding no caminho padrão; use o comando de status de memória profundo quando quiser uma verificação ativa do provedor.

    Use `openclaw memory status --deep` para verificar a prontidão de embeddings no runtime.

  </Accordion>
  <Accordion title="14. Avisos de status de canais">
    Se o Gateway estiver íntegro, o doctor executa uma sondagem de status dos canais e relata avisos com correções sugeridas.
  </Accordion>
  <Accordion title="15. Auditoria + reparo da configuração do supervisor">
    O doctor verifica a configuração do supervisor instalada (launchd/systemd/schtasks) em busca de padrões ausentes ou desatualizados (por exemplo, dependências systemd network-online e atraso de reinício). Quando encontra uma divergência, recomenda uma atualização e pode regravar o arquivo de serviço/tarefa com os padrões atuais.

    Observações:

    - `openclaw doctor` solicita confirmação antes de regravar a configuração do supervisor.
    - `openclaw doctor --yes` aceita os prompts de reparo padrão.
    - `openclaw doctor --repair` aplica correções recomendadas sem prompts.
    - `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mantém o doctor somente leitura para o ciclo de vida do serviço Gateway. Ele ainda relata a integridade do serviço e executa reparos que não são de serviço, mas pula instalação/início/reinício/bootstrap de serviço, regravações de configuração do supervisor e limpeza de serviço legado porque um supervisor externo é dono desse ciclo de vida.
    - No Linux, o doctor não regrava metadados de comando/entrypoint enquanto a unidade systemd correspondente do Gateway está ativa. Ele também ignora unidades extras inativas, não legadas e semelhantes ao Gateway durante a varredura de serviços duplicados, para que arquivos de serviço complementares não gerem ruído de limpeza.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação/reparo de serviço do doctor valida o SecretRef, mas não persiste valores de token em texto simples resolvidos nos metadados de ambiente do serviço supervisor.
    - O doctor detecta valores de ambiente de serviço gerenciados por `.env`/SecretRef que instalações antigas de LaunchAgent, systemd ou Tarefa Agendada do Windows embutiram inline e regrava os metadados do serviço para que esses valores sejam carregados da fonte de runtime em vez da definição do supervisor.
    - O doctor detecta quando o comando do serviço ainda fixa um `--port` antigo depois que `gateway.port` muda e regrava os metadados do serviço para a porta atual.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado não for resolvido, o doctor bloqueia o caminho de instalação/reparo com orientações acionáveis.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
    - Para unidades user-systemd do Linux, as verificações de divergência de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
    - Os reparos de serviço do doctor se recusam a regravar, parar ou reiniciar um serviço Gateway de um binário OpenClaw mais antigo quando a configuração foi gravada pela última vez por uma versão mais nova. Consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Você sempre pode forçar uma regravação completa via `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnósticos de runtime + porta do Gateway">
    O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o serviço está instalado, mas não está realmente em execução. Ele também verifica colisões de porta na porta do Gateway (padrão `18789`) e informa causas prováveis (Gateway já em execução, túnel SSH).
  </Accordion>
  <Accordion title="17. Boas práticas de runtime do Gateway">
    O doctor avisa quando o serviço Gateway é executado no Bun ou em um caminho de Node gerenciado por versão (`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node, e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação de Node do sistema quando disponível (Homebrew/apt/choco).

    LaunchAgents do macOS recém-instalados ou reparados usam um PATH canônico do sistema (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) em vez de copiar o PATH do shell interativo, então binários do sistema gerenciados pelo Homebrew continuam disponíveis enquanto Volta, asdf, fnm, pnpm e outros diretórios de gerenciadores de versão não alteram qual Node os processos filhos resolvem. Serviços Linux ainda mantêm raízes de ambiente explícitas (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) e diretórios user-bin estáveis, mas diretórios fallback presumidos de gerenciadores de versão só são gravados no PATH do serviço quando esses diretórios existem no disco.

  </Accordion>
  <Accordion title="18. Gravação de configuração + metadados do assistente">
    O doctor persiste quaisquer mudanças de configuração e marca metadados do assistente para registrar a execução do doctor.
  </Accordion>
  <Accordion title="19. Dicas de workspace (backup + sistema de memória)">
    O doctor sugere um sistema de memória de workspace quando ausente e imprime uma dica de backup se o workspace ainda não estiver sob git.

    Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para ver um guia completo sobre estrutura de workspace e backup com git (GitHub ou GitLab privado recomendado).

  </Accordion>
</AccordionGroup>

## Relacionados

- [Runbook do Gateway](/pt-BR/gateway)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
