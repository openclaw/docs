---
read_when:
    - Adicionar ou modificar migrações do doctor
    - Introduzir mudanças incompatíveis de configuração
summary: 'Comando Doctor: verificações de integridade, migrações de configuração e etapas de reparo'
title: Doctor
x-i18n:
    generated_at: "2026-04-06T03:08:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c0a15c522994552a1eef39206bed71fc5bf45746776372f24f31c101bfbd411
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` é a ferramenta de reparo + migração do OpenClaw. Ela corrige
configurações/estado desatualizados, verifica a integridade e fornece etapas de reparo acionáveis.

## Início rápido

```bash
openclaw doctor
```

### Headless / automação

```bash
openclaw doctor --yes
```

Aceita os padrões sem solicitar confirmação (incluindo etapas de reparo de restart/serviço/sandbox quando aplicável).

```bash
openclaw doctor --repair
```

Aplica os reparos recomendados sem solicitar confirmação (reparos + restarts quando for seguro).

```bash
openclaw doctor --repair --force
```

Aplica também reparos agressivos (sobrescreve configurações personalizadas de supervisor).

```bash
openclaw doctor --non-interactive
```

Executa sem prompts e aplica apenas migrações seguras (normalização de configuração + movimentações de estado em disco). Ignora ações de restart/serviço/sandbox que exigem confirmação humana.
Migrações de estado legado são executadas automaticamente quando detectadas.

```bash
openclaw doctor --deep
```

Examina serviços do sistema em busca de instalações extras do gateway (launchd/systemd/schtasks).

Se você quiser revisar as mudanças antes de gravar, abra primeiro o arquivo de configuração:

```bash
cat ~/.openclaw/openclaw.json
```

## O que ele faz (resumo)

- Atualização prévia opcional para instalações por git (apenas interativo).
- Verificação de atualização do protocolo da UI (recompila a Control UI quando o schema do protocolo é mais novo).
- Verificação de integridade + prompt de restart.
- Resumo do status de Skills (elegíveis/ausentes/bloqueadas) e status de plugins.
- Normalização de configuração para valores legados.
- Migração da configuração Talk de campos legados planos `talk.*` para `talk.provider` + `talk.providers.<provider>`.
- Verificações de migração do browser para configurações legadas da extensão do Chrome e prontidão do Chrome MCP.
- Avisos de sobrescrita de provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Verificação de pré-requisitos TLS do OAuth para perfis OAuth do OpenAI Codex.
- Migração de estado legado em disco (sessions/dir do agent/auth do WhatsApp).
- Migração da chave de contrato de manifesto de plugin legado (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migração do armazenamento legado de cron (`jobId`, `schedule.cron`, campos de delivery/payload de nível superior, payload `provider`, jobs simples de fallback de webhook `notify: true`).
- Inspeção de arquivo de bloqueio de sessão e limpeza de locks obsoletos.
- Verificações de integridade e permissões do estado (sessions, transcrições, diretório de estado).
- Verificações de permissão do arquivo de configuração (chmod 600) ao executar localmente.
- Integridade da autenticação de modelo: verifica expiração de OAuth, pode renovar tokens prestes a expirar e informa estados de cooldown/desativação de perfis de autenticação.
- Detecção de diretório extra de workspace (`~/openclaw`).
- Reparo de imagem de sandbox quando o sandboxing está ativado.
- Migração de serviço legado e detecção de gateways extras.
- Migração de estado legado do canal Matrix (no modo `--fix` / `--repair`).
- Verificações de runtime do gateway (serviço instalado, mas não em execução; rótulo launchd em cache).
- Avisos de status de canais (sondados a partir do gateway em execução).
- Auditoria de configuração do supervisor (launchd/systemd/schtasks) com reparo opcional.
- Verificações de boas práticas do runtime do gateway (Node vs Bun, caminhos de gerenciadores de versão).
- Diagnóstico de conflito de porta do gateway (padrão `18789`).
- Avisos de segurança para políticas de DM abertas.
- Verificações de autenticação do gateway para modo de token local (oferece geração de token quando não existe fonte de token; não sobrescreve configurações de token com SecretRef).
- Verificação de linger do systemd no Linux.
- Verificação do tamanho de arquivo bootstrap do workspace (avisos de truncamento/perto do limite para arquivos de contexto).
- Verificação de status e instalação/upgrade automático de conclusão de shell.
- Verificação de prontidão do provider de embeddings da busca de memória (modelo local, chave de API remota ou binário QMD).
- Verificações de instalação por código-fonte (incompatibilidade de workspace pnpm, assets de UI ausentes, binário tsx ausente).
- Grava configuração atualizada + metadados do assistente.

## Comportamento detalhado e justificativa

### 0) Atualização opcional (instalações por git)

Se isto for um checkout git e o doctor estiver em execução de forma interativa, ele oferece
atualizar (fetch/rebase/build) antes de executar o doctor.

### 1) Normalização da configuração

Se a configuração contiver formatos legados de valor (por exemplo `messages.ackReaction`
sem uma sobrescrita específica de canal), o doctor os normaliza para o schema atual.

Isso inclui campos legados planos de Talk. A configuração pública atual de Talk é
`talk.provider` + `talk.providers.<provider>`. O doctor reescreve os formatos antigos
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` no mapa de providers.

### 2) Migrações de chaves de configuração legadas

Quando a configuração contém chaves obsoletas, outros comandos se recusam a executar e pedem
para você executar `openclaw doctor`.

O doctor irá:

- Explicar quais chaves legadas foram encontradas.
- Mostrar a migração que aplicou.
- Reescrever `~/.openclaw/openclaw.json` com o schema atualizado.

O Gateway também executa automaticamente migrações do doctor na inicialização quando detecta um
formato legado de configuração, para que configurações desatualizadas sejam reparadas sem intervenção manual.
Migrações de armazenamento de jobs cron são tratadas por `openclaw doctor --fix`.

Migrações atuais:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de nível superior
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legado `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canais com `accounts` nomeadas, mas com valores de canal de conta única ainda no nível superior, mover esses valores com escopo de conta para a conta promovida escolhida para aquele canal (`accounts.default` para a maioria dos canais; Matrix pode preservar um destino nomeado/padrão correspondente já existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- remover `browser.relayBindHost` (configuração legada de relay da extensão)

Os avisos do doctor também incluem orientações de conta padrão para canais com múltiplas contas:

- Se duas ou mais entradas `channels.<channel>.accounts` estiverem configuradas sem `channels.<channel>.defaultAccount` ou `accounts.default`, o doctor avisa que o roteamento de fallback pode escolher uma conta inesperada.
- Se `channels.<channel>.defaultAccount` estiver definido para um ID de conta desconhecido, o doctor avisa e lista os IDs de conta configurados.

### 2b) Sobrescritas de provider OpenCode

Se você adicionou `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manualmente, isso sobrescreve o catálogo OpenCode integrado de `@mariozechner/pi-ai`.
Isso pode forçar modelos para a API errada ou zerar custos. O doctor avisa para que você
possa remover a sobrescrita e restaurar o roteamento por API por modelo + custos.

### 2c) Migração do browser e prontidão do Chrome MCP

Se a configuração do seu browser ainda apontar para o caminho removido da extensão do Chrome, o doctor
a normaliza para o modelo atual de conexão host-local do Chrome MCP:

- `browser.profiles.*.driver: "extension"` passa a ser `"existing-session"`
- `browser.relayBindHost` é removido

O doctor também audita o caminho host-local do Chrome MCP quando você usa `defaultProfile:
"user"` ou um perfil `existing-session` configurado:

- verifica se o Google Chrome está instalado no mesmo host para perfis padrão
  de conexão automática
- verifica a versão detectada do Chrome e avisa quando for inferior ao Chrome 144
- lembra você de ativar a depuração remota na página de inspeção do navegador (por
  exemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

O doctor não pode ativar a configuração do lado do Chrome para você. O Chrome MCP host-local
ainda exige:

- um navegador baseado em Chromium 144+ no host do gateway/node
- o navegador em execução localmente
- depuração remota ativada nesse navegador
- aprovação do primeiro prompt de consentimento de conexão no navegador

A prontidão aqui trata apenas dos pré-requisitos da conexão local. Existing-session mantém
os limites atuais de rota do Chrome MCP; rotas avançadas como `responsebody`, exportação
de PDF, interceptação de download e ações em lote ainda exigem um
browser gerenciado ou perfil CDP bruto.

Esta verificação **não** se aplica a fluxos Docker, sandbox, remote-browser ou outros
fluxos headless. Eles continuam a usar CDP bruto.

### 2d) Pré-requisitos TLS do OAuth

Quando um perfil OAuth do OpenAI Codex está configurado, o doctor sonda o endpoint de
autorização da OpenAI para verificar se a stack TLS local de Node/OpenSSL consegue
validar a cadeia de certificados. Se a sonda falhar com erro de certificado (por
exemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado expirado ou certificado autoassinado),
o doctor imprime orientações de correção específicas da plataforma. No macOS com Node do Homebrew, a
correção geralmente é `brew postinstall ca-certificates`. Com `--deep`, a sonda é executada
mesmo se o gateway estiver íntegro.

### 3) Migrações de estado legado (layout em disco)

O doctor pode migrar layouts antigos em disco para a estrutura atual:

- Armazenamento de sessões + transcrições:
  - de `~/.openclaw/sessions/` para `~/.openclaw/agents/<agentId>/sessions/`
- Diretório do agente:
  - de `~/.openclaw/agent/` para `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticação do WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` legado (exceto `oauth.json`)
  - para `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de conta padrão: `default`)

Essas migrações são best-effort e idempotentes; o doctor emitirá avisos quando
deixar quaisquer pastas legadas para trás como backups. O Gateway/CLI também faz migração automática
das sessions legadas + diretório do agent na inicialização para que histórico/autenticação/modelos caiam no
caminho por agente sem exigir uma execução manual do doctor. A autenticação do WhatsApp é
intencionalmente migrada apenas via `openclaw doctor`. A normalização de provider/mapa de provider do Talk agora
compara por igualdade estrutural, então diferenças apenas na ordem das chaves não disparam
novamente mudanças sem efeito em `doctor --fix`.

### 3a) Migrações legadas de manifesto de plugin

O doctor examina todos os manifestos de plugins instalados em busca de chaves de capacidade de
nível superior obsoletas (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Quando encontradas, ele oferece movê-las para o objeto `contracts`
e reescrever o arquivo de manifesto no lugar. Essa migração é idempotente;
se a chave `contracts` já tiver os mesmos valores, a chave legada será removida
sem duplicar os dados.

### 3b) Migrações legadas do armazenamento cron

O doctor também verifica o armazenamento de jobs cron (`~/.openclaw/cron/jobs.json` por padrão,
ou `cron.store` quando sobrescrito) em busca de formatos antigos de job que o scheduler ainda
aceita por compatibilidade.

As limpezas cron atuais incluem:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload de nível superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de delivery de nível superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- aliases de delivery `provider` no payload → `delivery.channel` explícito
- jobs simples legados de fallback de webhook `notify: true` → `delivery.mode="webhook"` explícito com `delivery.to=cron.webhook`

O doctor só migra automaticamente jobs `notify: true` quando consegue fazer isso sem
alterar o comportamento. Se um job combinar fallback legado de notify com um
modo de delivery não-webhook já existente, o doctor avisa e deixa esse job para revisão manual.

### 3c) Limpeza de lock de sessão

O doctor examina o diretório de sessão de cada agente em busca de arquivos obsoletos de lock de gravação — arquivos deixados
para trás quando uma sessão foi encerrada de forma anormal. Para cada arquivo de lock encontrado, ele informa:
o caminho, PID, se o PID ainda está ativo, a idade do lock e se ele é
considerado obsoleto (PID morto ou mais de 30 minutos). No modo `--fix` / `--repair`
ele remove automaticamente arquivos de lock obsoletos; caso contrário, imprime uma observação e
instrui você a executar novamente com `--fix`.

### 4) Verificações de integridade do estado (persistência de sessão, roteamento e segurança)

O diretório de estado é o tronco operacional principal. Se ele desaparecer, você perde
sessões, credenciais, logs e configuração (a menos que tenha backups em outro lugar).

O doctor verifica:

- **Diretório de estado ausente**: avisa sobre perda catastrófica de estado, solicita recriar
  o diretório e lembra que não pode recuperar dados ausentes.
- **Permissões do diretório de estado**: verifica capacidade de gravação; oferece reparar permissões
  (e emite uma dica de `chown` quando detecta incompatibilidade de owner/group).
- **Diretório de estado sincronizado por nuvem no macOS**: avisa quando o estado é resolvido sob iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` porque caminhos com sync podem causar I/O mais lento
  e disputas de lock/sincronização.
- **Diretório de estado em SD ou eMMC no Linux**: avisa quando o estado é resolvido para uma origem de montagem `mmcblk*`,
  porque I/O aleatório sustentado por SD ou eMMC pode ser mais lento e desgastar
  mais rápido com gravações de sessão e credenciais.
- **Diretórios de sessão ausentes**: `sessions/` e o diretório de armazenamento de sessão são
  necessários para persistir histórico e evitar falhas `ENOENT`.
- **Incompatibilidade de transcrição**: avisa quando entradas recentes de sessão têm arquivos
  de transcrição ausentes.
- **Sessão principal “JSONL de 1 linha”**: sinaliza quando a transcrição principal tem apenas uma
  linha (o histórico não está se acumulando).
- **Múltiplos diretórios de estado**: avisa quando existem múltiplas pastas `~/.openclaw` em
  diretórios home diferentes ou quando `OPENCLAW_STATE_DIR` aponta para outro local (o histórico pode
  se dividir entre instalações).
- **Lembrete de modo remoto**: se `gateway.mode=remote`, o doctor lembra você de executá-lo
  no host remoto (o estado fica lá).
- **Permissões do arquivo de configuração**: avisa se `~/.openclaw/openclaw.json` estiver
  legível por grupo/mundo e oferece restringir para `600`.

### 5) Integridade da autenticação do modelo (expiração OAuth)

O doctor inspeciona perfis OAuth no armazenamento de autenticação, avisa quando tokens estão
prestes a expirar/expirados e pode renová-los quando for seguro. Se o perfil
OAuth/token da Anthropic estiver desatualizado, ele sugere uma chave de API da Anthropic ou o caminho legado
de setup-token da Anthropic.
Prompts de refresh só aparecem ao executar interativamente (TTY); `--non-interactive`
ignora tentativas de refresh.

O doctor também detecta estado obsoleto removido do Anthropic Claude CLI. Se bytes antigos de credencial
`anthropic:claude-cli` ainda existirem em `auth-profiles.json`,
o doctor os converte de volta em perfis Anthropic token/OAuth e reescreve
referências obsoletas de modelo `claude-cli/...`.
Se os bytes tiverem sumido, o doctor remove a configuração obsoleta e imprime
comandos de recuperação.

O doctor também informa perfis de autenticação temporariamente inutilizáveis devido a:

- cooldowns curtos (limites de taxa/timeouts/falhas de autenticação)
- desativações mais longas (falhas de cobrança/crédito)

### 6) Validação do modelo de hooks

Se `hooks.gmail.model` estiver definido, o doctor valida a referência de modelo em relação ao
catálogo e allowlist e avisa quando ela não puder ser resolvida ou não for permitida.

### 7) Reparo da imagem de sandbox

Quando o sandboxing está ativado, o doctor verifica imagens Docker e oferece construir ou
trocar para nomes legados se a imagem atual estiver ausente.

### 7b) Dependências de runtime de plugins integrados

O doctor verifica se as dependências de runtime de plugins integrados (por exemplo os
pacotes de runtime do plugin Discord) estão presentes na raiz de instalação do OpenClaw.
Se alguma estiver ausente, o doctor informa os pacotes e os instala no
modo `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrações de serviço do gateway e dicas de limpeza

O doctor detecta serviços legados do gateway (launchd/systemd/schtasks) e
oferece removê-los e instalar o serviço OpenClaw usando a porta atual do gateway.
Ele também pode examinar serviços extras semelhantes a gateway e imprimir dicas de limpeza.
Serviços de gateway OpenClaw nomeados por perfil são considerados de primeira classe e não
são sinalizados como "extras".

### 8b) Migração Matrix na inicialização

Quando uma conta do canal Matrix tem uma migração de estado legado pendente ou acionável,
o doctor (no modo `--fix` / `--repair`) cria um snapshot pré-migração e então
executa as etapas de migração best-effort: migração do estado legado do Matrix e preparação do
estado criptografado legado. Ambas as etapas não são fatais; erros são registrados em log e a
inicialização continua. Em modo somente leitura (`openclaw doctor` sem `--fix`) esta verificação
é totalmente ignorada.

### 9) Avisos de segurança

O doctor emite avisos quando um provider está aberto a DMs sem uma allowlist, ou
quando uma política está configurada de forma perigosa.

### 10) Linger do systemd (Linux)

Se estiver em execução como serviço de usuário systemd, o doctor garante que o linger esteja ativado para que o
gateway permaneça ativo após logout.

### 11) Status do workspace (Skills, plugins e diretórios legados)

O doctor imprime um resumo do estado do workspace para o agente padrão:

- **Status de Skills**: conta Skills elegíveis, com requisitos ausentes e bloqueadas por allowlist.
- **Diretórios legados do workspace**: avisa quando `~/openclaw` ou outros diretórios legados do workspace
  existem junto com o workspace atual.
- **Status de plugins**: conta plugins carregados/desativados/com erro; lista IDs de plugins para quaisquer
  erros; informa capacidades de plugins do bundle.
- **Avisos de compatibilidade de plugins**: sinaliza plugins que têm problemas de compatibilidade com
  o runtime atual.
- **Diagnósticos de plugins**: exibe quaisquer avisos ou erros de tempo de carregamento emitidos pelo
  registro de plugins.

### 11b) Tamanho do arquivo bootstrap

O doctor verifica se arquivos bootstrap do workspace (por exemplo `AGENTS.md`,
`CLAUDE.md` ou outros arquivos de contexto injetados) estão próximos ou acima do
orçamento configurado de caracteres. Ele informa por arquivo as contagens de caracteres brutos vs. injetados, porcentagem
de truncamento, causa do truncamento (`max/file` ou `max/total`) e total de caracteres injetados
como fração do orçamento total. Quando arquivos são truncados ou estão próximos
do limite, o doctor imprime dicas para ajustar `agents.defaults.bootstrapMaxChars`
e `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Conclusão de shell

O doctor verifica se a conclusão por tabulação está instalada para o shell atual
(zsh, bash, fish ou PowerShell):

- Se o perfil do shell usar um padrão lento de conclusão dinâmica
  (`source <(openclaw completion ...)`), o doctor o atualiza para a variante
  mais rápida com arquivo em cache.
- Se a conclusão estiver configurada no perfil, mas o arquivo de cache estiver ausente,
  o doctor regenera o cache automaticamente.
- Se não houver nenhuma conclusão configurada, o doctor solicita instalá-la
  (somente modo interativo; ignorado com `--non-interactive`).

Execute `openclaw completion --write-state` para regenerar manualmente o cache.

### 12) Verificações de autenticação do gateway (token local)

O doctor verifica a prontidão da autenticação por token local do gateway.

- Se o modo token precisar de um token e não existir fonte de token, o doctor oferece gerar um.
- Se `gateway.auth.token` for gerenciado por SecretRef, mas estiver indisponível, o doctor avisa e não o sobrescreve com texto simples.
- `openclaw doctor --generate-gateway-token` força a geração apenas quando nenhum token SecretRef estiver configurado.

### 12b) Reparos em modo somente leitura com reconhecimento de SecretRef

Alguns fluxos de reparo precisam inspecionar credenciais configuradas sem enfraquecer o comportamento de fail-fast em runtime.

- `openclaw doctor --fix` agora usa o mesmo modelo resumido somente leitura com reconhecimento de SecretRef dos comandos da família status para reparos de configuração direcionados.
- Exemplo: reparo de `allowFrom` / `groupAllowFrom` `@username` do Telegram tenta usar credenciais configuradas do bot quando disponíveis.
- Se o token do bot do Telegram estiver configurado via SecretRef, mas indisponível no caminho do comando atual, o doctor informa que a credencial está configurada-mas-indisponível e ignora a resolução automática em vez de falhar ou informar incorretamente o token como ausente.

### 13) Verificação de integridade do gateway + restart

O doctor executa uma verificação de integridade e oferece reiniciar o gateway quando ele parece
não íntegro.

### 13b) Prontidão da busca de memória

O doctor verifica se o provider configurado de embeddings da busca de memória está pronto
para o agente padrão. O comportamento depende do backend e provider configurados:

- **Backend QMD**: sonda se o binário `qmd` está disponível e inicializável.
  Caso contrário, imprime orientações de correção incluindo o pacote npm e uma opção manual de caminho do binário.
- **Provider local explícito**: verifica um arquivo de modelo local ou uma URL reconhecida de
  modelo remoto/baixável. Se estiver ausente, sugere mudar para um provider remoto.
- **Provider remoto explícito** (`openai`, `voyage`, etc.): verifica se uma chave de API está
  presente no ambiente ou no armazenamento de autenticação. Imprime dicas acionáveis de correção se estiver ausente.
- **Provider automático**: verifica primeiro a disponibilidade de modelo local e, em seguida, tenta cada
  provider remoto na ordem de seleção automática.

Quando um resultado de sonda do gateway estiver disponível (o gateway estava íntegro no momento da
verificação), o doctor cruza o resultado com a configuração visível pela CLI e observa
qualquer discrepância.

Use `openclaw memory status --deep` para verificar a prontidão dos embeddings em runtime.

### 14) Avisos de status de canal

Se o gateway estiver íntegro, o doctor executa uma sonda de status de canal e informa
avisos com correções sugeridas.

### 15) Auditoria + reparo da configuração do supervisor

O doctor verifica se a configuração instalada do supervisor (launchd/systemd/schtasks) tem
padrões ausentes ou desatualizados (por exemplo dependências `network-online` do systemd e
atraso de restart). Quando encontra uma incompatibilidade, ele recomenda uma atualização e pode
reescrever o arquivo de serviço/tarefa para os padrões atuais.

Observações:

- `openclaw doctor` solicita confirmação antes de reescrever a configuração do supervisor.
- `openclaw doctor --yes` aceita os prompts de reparo padrão.
- `openclaw doctor --repair` aplica as correções recomendadas sem prompts.
- `openclaw doctor --repair --force` sobrescreve configurações personalizadas do supervisor.
- Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, o install/reparo de serviço pelo doctor valida o SecretRef, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
- Se a autenticação por token exigir um token e o token SecretRef configurado não estiver resolvido, o doctor bloqueia o caminho de instalação/reparo com orientação acionável.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados e `gateway.auth.mode` não estiver definido, o doctor bloqueia a instalação/reparo até que o modo seja definido explicitamente.
- Para unidades user-systemd no Linux, as verificações de drift de token do doctor agora incluem fontes `Environment=` e `EnvironmentFile=` ao comparar metadados de autenticação do serviço.
- Você sempre pode forçar uma reescrita completa com `openclaw gateway install --force`.

### 16) Diagnóstico de runtime + porta do gateway

O doctor inspeciona o runtime do serviço (PID, último status de saída) e avisa quando o
serviço está instalado mas não está realmente em execução. Ele também verifica conflitos
na porta do gateway (padrão `18789`) e informa causas prováveis (gateway já em
execução, túnel SSH).

### 17) Boas práticas de runtime do gateway

O doctor avisa quando o serviço do gateway é executado com Bun ou em um caminho Node gerenciado por versão
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Os canais WhatsApp + Telegram exigem Node,
e caminhos de gerenciadores de versão podem quebrar após upgrades porque o serviço não
carrega a inicialização do seu shell. O doctor oferece migrar para uma instalação Node do sistema quando
disponível (Homebrew/apt/choco).

### 18) Gravação da configuração + metadados do assistente

O doctor persiste quaisquer mudanças de configuração e registra metadados do assistente para
marcar a execução do doctor.

### 19) Dicas de workspace (backup + sistema de memória)

O doctor sugere um sistema de memória do workspace quando ele estiver ausente e imprime uma dica de backup
se o workspace ainda não estiver sob git.

Consulte [/concepts/agent-workspace](/pt-BR/concepts/agent-workspace) para um guia completo sobre
estrutura do workspace e backup com git (recomendado GitHub ou GitLab privados).
