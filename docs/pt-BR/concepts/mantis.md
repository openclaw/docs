---
read_when:
    - Criando ou executando controle de qualidade visual ao vivo para erros do OpenClaw
    - Adicionando verificação antes e depois para uma pull request
    - Adicionando cenários de transporte em tempo real do Discord, Slack, WhatsApp ou outros
    - Depuração de execuções de QA que precisam de capturas de tela, automação de navegador ou acesso VNC
summary: Mantis é o sistema visual de verificação de ponta a ponta para reproduzir falhas do OpenClaw em transportes ativos, capturar evidências de antes e depois e anexar artefatos a PRs.
title: Louva-a-deus
x-i18n:
    generated_at: "2026-05-03T21:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis é o sistema de verificação de ponta a ponta do OpenClaw para bugs que precisam de um
runtime real, um transporte real e prova visível. Ele executa um cenário contra uma ref ruim
conhecida, captura evidências, executa o mesmo cenário contra uma ref candidata e
publica a comparação como artefatos que um mantenedor pode inspecionar a partir de um PR ou
de um comando local.

Mantis começa com Discord porque o Discord nos oferece uma primeira faixa de alto valor:
autenticação real de bot, canais de guilda reais, reações, threads, comandos nativos e uma
interface de navegador em que humanos podem confirmar visualmente o que o transporte mostrou.

## Objetivos

- Reproduzir um bug de uma issue ou PR do GitHub com o mesmo formato de transporte que os usuários
  veem.
- Capturar um artefato **antes** na ref de baseline antes de aplicar a correção.
- Capturar um artefato **depois** na ref candidata depois de aplicar a correção.
- Usar um oráculo determinístico sempre que possível, como uma leitura de reação via REST do Discord
  ou uma verificação de transcrição de canal.
- Capturar screenshots quando o bug tiver uma superfície de UI visível.
- Executar localmente a partir de uma CLI controlada por agente e remotamente a partir do GitHub.
- Preservar estado de máquina suficiente para resgate por VNC quando login, automação de navegador ou
  autenticação de provedor travar.
- Publicar status conciso em um canal Discord de operadores quando a execução estiver bloqueada,
  precisar de ajuda manual por VNC ou terminar.

## Não objetivos

- Mantis não substitui testes unitários. Uma execução do Mantis normalmente deve se tornar
  um teste de regressão menor depois que a correção for compreendida.
- Mantis não é o gate normal de CI rápido. Ele é mais lento, usa credenciais reais e
  é reservado para bugs em que o ambiente real importa.
- Mantis não deve exigir um humano para operação normal. VNC manual é um caminho de resgate,
  não o caminho feliz.
- Mantis não armazena segredos brutos em artefatos, logs, screenshots, relatórios em Markdown
  ou comentários de PR.

## Propriedade

Mantis vive na pilha de QA do OpenClaw.

- OpenClaw possui o runtime de cenários, adaptadores de transporte, esquema de evidências e
  CLI local em `pnpm openclaw qa mantis`.
- QA Lab possui as partes do harness de transporte real, auxiliares de captura de navegador e
  gravadores de artefatos.
- Crabbox possui as máquinas Linux aquecidas quando uma VM remota é necessária.
- GitHub Actions possui o ponto de entrada do workflow remoto e a retenção de artefatos.
- ClawSweeper possui o roteamento de comentários do GitHub: analisar comandos de mantenedores,
  disparar o workflow e publicar o comentário final no PR.
- Agentes OpenClaw conduzem o Mantis por meio do Codex quando um cenário precisa de configuração agêntica,
  depuração ou relatório de estado travado.

Esse limite mantém o conhecimento de transporte no OpenClaw, o agendamento de máquinas no
Crabbox e a cola do fluxo de trabalho de mantenedores no ClawSweeper.

## Formato do comando

O primeiro comando local verifica o bot do Discord, guilda, canal, envio de mensagem,
envio de reação e caminho de artefato:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

O executor local de antes e depois aceita este formato:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

O executor cria worktrees destacadas de baseline e candidata sob o diretório de saída,
instala dependências, compila cada ref, executa o cenário com
`--allow-failures` e então escreve `baseline/`, `candidate/`, `comparison.json`
e `mantis-report.md`. Para o primeiro cenário do Discord, uma verificação bem-sucedida
significa que o status do baseline é `fail` e o status da candidata é `pass`.

O workflow de smoke do GitHub é `Mantis Discord Smoke`. O workflow de antes e depois do GitHub
para o primeiro cenário real é `Mantis Discord Status Reactions`. Ele
aceita:

- `baseline_ref`: a ref esperada para reproduzir o comportamento apenas enfileirado.
- `candidate_ref`: a ref esperada para mostrar `queued -> thinking -> done`.

Ele faz checkout da ref do harness do workflow, compila worktrees separadas de baseline e candidata,
executa `discord-status-reactions-tool-only` contra cada worktree e
envia `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` como
artefatos do Actions.

Você também pode disparar a execução de status-reactions diretamente de um comentário de PR:

```text
@Mantis discord status reactions
```

O gatilho de comentário é intencionalmente estreito. Ele só executa em comentários de pull request
de usuários com acesso write, maintain ou admin, e só reconhece
solicitações de reação de status do Discord. Por padrão, ele usa a ref baseline ruim conhecida
e o SHA atual do head do PR como candidata. Mantenedores podem substituir qualquer uma das
refs:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Exemplos de comandos do ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

O primeiro comando é explícito e focado no cenário. O segundo pode futuramente mapear um PR
ou issue para cenários Mantis recomendados a partir de labels, arquivos alterados e
achados de revisão do ClawSweeper.

## Ciclo de vida da execução

1. Adquirir credenciais.
2. Alocar ou reutilizar uma VM.
3. Preparar um checkout limpo para a ref de baseline.
4. Instalar dependências e compilar apenas o que o cenário precisa.
5. Iniciar um Gateway OpenClaw filho com um diretório de estado isolado.
6. Configurar o transporte real, provedor, modelo e perfil de navegador.
7. Executar o cenário e capturar evidências de baseline.
8. Parar o Gateway e preservar logs.
9. Preparar a ref candidata na mesma VM.
10. Executar o mesmo cenário e capturar evidências da candidata.
11. Comparar os resultados do oráculo e as evidências visuais.
12. Escrever Markdown, JSON, logs, screenshots e artefatos de rastreamento opcionais.
13. Enviar artefatos do GitHub Actions.
14. Publicar uma mensagem concisa de status no PR ou Discord.

O cenário deve ser capaz de falhar de duas maneiras diferentes:

- **Bug reproduzido**: o baseline falhou da maneira esperada.
- **Falha do harness**: configuração de ambiente, credenciais, API do Discord, navegador ou
  provedor falhou antes que o oráculo do bug fosse significativo.

O relatório final deve separar esses casos para que mantenedores não confundam um ambiente
instável com comportamento do produto.

## MVP do Discord

O primeiro cenário deve mirar reações de status do Discord em canais de guilda em que
o modo de entrega de resposta de origem é `message_tool_only`.

Por que ele é uma boa semente para o Mantis:

- Ele é visível no Discord como reações na mensagem disparadora.
- Ele tem um oráculo REST forte por meio do estado de reação da mensagem do Discord.
- Ele exercita um Gateway OpenClaw real, autenticação de bot do Discord, despacho de mensagem,
  modo de entrega de resposta de origem, estado de reação de status e ciclo de vida de turno do modelo.
- Ele é estreito o suficiente para manter a primeira implementação honesta.

Formato esperado do cenário:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

As evidências de baseline devem mostrar a reação de reconhecimento enfileirada, mas nenhuma
transição de ciclo de vida no modo somente ferramenta. As evidências da candidata devem mostrar reações de status de ciclo de vida
rodando quando `messages.statusReactions.enabled` está explicitamente
true.

O primeiro recorte executável é o cenário de QA real do Discord com opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Ele configura o SUT com tratamento de guilda sempre ativo, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reações de status explícitas. O oráculo
consulta a mensagem disparadora real do Discord e espera a sequência observada
`👀 -> 🤔 -> 👍`. Os artefatos incluem `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componentes de QA existentes

Mantis deve se basear na pilha privada de QA existente em vez de começar do
zero:

- `pnpm openclaw qa discord` já executa uma faixa real do Discord com bots driver e
  SUT.
- O executor de transporte real já escreve relatórios e artefatos de mensagens observadas
  em `.artifacts/qa-e2e/`.
- Concessões de credenciais do Convex já fornecem acesso exclusivo a credenciais compartilhadas de
  transporte real.
- O serviço de controle de navegador já oferece suporte a screenshots, snapshots,
  perfis gerenciados headless e perfis CDP remotos.
- QA Lab já tem uma UI de depuração e barramento para testes no formato de transporte.

A primeira implementação do Mantis pode ser um executor fino de antes/depois sobre essas
peças, mais uma camada de evidência visual.

## Modelo de evidências

Toda execução escreve um diretório de artefatos estável:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` deve ser a fonte da verdade legível por máquina. O
relatório em Markdown é para comentários de PR e revisão humana.

O resumo deve incluir:

- refs e SHAs testados
- transporte e id do cenário
- provedor da máquina e id da máquina ou id da concessão
- fonte de credenciais sem valores secretos
- resultado do baseline
- resultado da candidata
- se o bug foi reproduzido no baseline
- se a candidata o corrigiu
- caminhos dos artefatos
- problemas de configuração ou limpeza sanitizados

Screenshots são evidências, não segredos. Elas ainda precisam de disciplina de redação:
nomes de canais privados, nomes de usuários ou conteúdo de mensagens podem aparecer. Para PRs públicos,
prefira links de artefatos do GitHub Actions em vez de imagens inline até que a história de redação
esteja mais forte.

## Navegador e VNC

A faixa de navegador tem dois modos:

- **Automação headless**: padrão para CI. Chrome roda com CDP habilitado, e
  Playwright ou o controle de navegador do OpenClaw captura screenshots.
- **Resgate por VNC**: habilitado na mesma VM quando login, MFA, anti-automação do Discord
  ou depuração visual precisa de um humano.

O perfil de navegador observador do Discord deve ser persistente o suficiente para evitar
login a cada execução, mas isolado do estado pessoal do navegador. Um perfil
pertence ao pool de máquinas do Mantis, não a um laptop de desenvolvedor.

Quando o Mantis trava, ele publica uma mensagem de status no Discord com:

- id da execução
- id do cenário
- provedor da máquina
- diretório de artefatos
- instruções de conexão VNC ou noVNC, se disponíveis
- texto curto do bloqueador

A primeira implantação privada pode publicar essas mensagens no canal de operadores existente
e migrar depois para um canal dedicado do Mantis.

## Máquinas

Mantis deve preferir AWS por meio do Crabbox para a primeira implementação remota.
Crabbox nos oferece máquinas aquecidas, rastreamento de concessões, hidratação, logs, resultados e
limpeza. Se a capacidade da AWS for lenta demais ou indisponível, adicione um provedor Hetzner
por trás da mesma interface de máquina.

Requisitos mínimos da VM:

- Linux com uma instalação de Chrome ou Chromium capaz de desktop
- acesso CDP para automação de navegador
- VNC ou noVNC para resgate
- Node 22 e pnpm
- checkout do OpenClaw e cache de dependências
- cache do navegador Playwright Chromium quando Playwright for usado
- CPU e memória suficientes para um Gateway OpenClaw, um navegador e uma execução de modelo
- acesso de saída ao Discord, GitHub, provedores de modelo e broker de credenciais

A VM não deve manter segredos brutos de longa duração fora dos armazenamentos esperados de credenciais ou
perfil de navegador.

## Segredos

Segredos vivem em segredos de organização ou repositório do GitHub para execuções remotas, e em
um arquivo de segredo local controlado pelo operador para execuções locais.

Nomes de segredo recomendados:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` para uploads públicos de artefatos no GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

No longo prazo, o pool de credenciais do Convex deve continuar sendo a fonte normal para credenciais de transporte ao vivo. Os segredos do GitHub inicializam o broker e as lanes de fallback.

O runner do Mantis nunca deve imprimir:

- tokens de bot do Discord
- chaves de API de provedores
- cookies do navegador
- conteúdo de perfis de autenticação
- senhas de VNC
- payloads brutos de credenciais

Uploads públicos de artefatos também devem ocultar metadados de destino do Discord, como IDs de bot, guild, canal e mensagem. O fluxo de trabalho de smoke do GitHub habilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` por esse motivo.

Se um token for colado acidentalmente em uma issue, PR, chat ou log, faça a rotação dele depois que o novo segredo tiver sido armazenado.

## Artefatos do GitHub e comentários de PR

Os fluxos de trabalho do Mantis devem enviar o pacote completo de evidências como um artefato de curta duração do Actions. Quando o fluxo de trabalho for executado para um relatório de bug ou PR de correção, ele também deve publicar as capturas de tela PNG redigidas no branch `qa-artifacts` e fazer upsert de um comentário nesse bug ou PR de correção com capturas de tela inline de antes/depois. Não publique a prova principal apenas em um PR genérico de automação de QA. Logs brutos, mensagens observadas e outras evidências volumosas permanecem no artefato do Actions.

Fluxos de trabalho de produção devem publicar esses comentários com o GitHub App do Mantis, não com `github-actions[bot]`. Armazene o ID do app e a chave privada como segredos do GitHub Actions `MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. O fluxo de trabalho usa um marcador oculto como chave de upsert, atualiza esse comentário quando o token consegue editá-lo e cria um novo comentário de propriedade do Mantis quando um marcador antigo de propriedade do bot não pode ser editado.

O comentário do PR deve ser curto e visual:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Quando a execução falhar porque o harness falhou, o comentário deve dizer isso em vez de insinuar que o candidato falhou.

## Notas de implantação privada

Uma implantação privada talvez já tenha uma aplicação Discord do Mantis. Reutilize essa aplicação em vez de criar outro app quando ela tiver as permissões de bot corretas e puder passar por rotação com segurança.

Configure o canal inicial de notificação do operador por meio de segredos ou da configuração de implantação. Ele pode apontar primeiro para um canal existente de mantenedores ou operações e depois mudar para um canal dedicado do Mantis quando existir um.

Não coloque IDs de guild, IDs de canal, tokens de bot, cookies de navegador ou senhas de VNC neste documento. Armazene-os em segredos do GitHub, no broker de credenciais ou no armazenamento local de segredos do operador.

## Como adicionar um cenário

Um cenário do Mantis deve declarar:

- ID e título
- transporte
- credenciais necessárias
- política de ref da baseline
- política de ref do candidato
- patch de configuração do OpenClaw
- etapas de configuração
- estímulo
- oráculo esperado da baseline
- oráculo esperado do candidato
- alvos de captura visual
- orçamento de timeout
- etapas de limpeza

Os cenários devem preferir oráculos pequenos e tipados:

- estado de reação do Discord para bugs de reação
- referências de mensagem do Discord para bugs de threading
- ts de thread do Slack e estado da API de reação para bugs do Slack
- IDs de mensagem e cabeçalhos de email para bugs de email
- capturas de tela do navegador quando a UI for o único observável confiável

Verificações por visão devem ser aditivas. Se uma API de plataforma puder provar o bug, use a API como o oráculo de aprovação/falha e mantenha capturas de tela para confiança humana.

## Expansão de provedores

Depois do Discord, o mesmo runner pode adicionar:

- Slack: reações, threads, menções ao app, modais, uploads de arquivos.
- Email: autenticação do Gmail e threading de mensagens usando `gog` quando conectores não forem suficientes.
- WhatsApp: login por QR, reidentificação, entrega de mensagens, mídia, reações.
- Telegram: gate de menções em grupo, comandos, reações quando disponíveis.
- Matrix: salas criptografadas, relações de thread ou resposta, retomada após reinicialização.

Cada transporte deve ter um cenário de smoke barato e um ou mais cenários de classe de bug. Cenários visuais caros devem permanecer opt-in.

## Perguntas em aberto

- Qual bot do Discord deve ser o driver e qual deve ser o SUT quando o bot existente do Mantis for reutilizado?
- O login do navegador observador deve usar uma conta humana do Discord, uma conta de teste ou apenas evidência REST legível por bot na primeira fase?
- Por quanto tempo o GitHub deve reter artefatos do Mantis para PRs?
- Quando o ClawSweeper deve recomendar automaticamente o Mantis em vez de esperar por um comando de mantenedor?
- As capturas de tela devem ser redigidas ou recortadas antes do upload para PRs públicos?
