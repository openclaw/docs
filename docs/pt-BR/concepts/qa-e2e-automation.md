---
doc-schema-version: 1
read_when:
    - Entendendo como a pilha de QA se integra
    - Estendendo o qa-lab, o qa-channel ou um adaptador de transporte
    - Adição de cenários de QA baseados em repositório
    - Criação de automação de QA com maior realismo para o painel do Gateway
summary: 'Visão geral da pilha de QA: qa-lab, qa-channel, cenários baseados em repositório, fluxos de transporte em produção, adaptadores de transporte e relatórios.'
title: Visão geral de QA
x-i18n:
    generated_at: "2026-07-16T12:25:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

A pilha privada de QA exercita o OpenClaw de forma realista e semelhante a um canal, algo que
um teste unitário não consegue fazer.

Componentes:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: interface do depurador, barramento de QA, perfis de cenário e adaptadores de
  transporte em tempo real para observar a transcrição, injetar mensagens recebidas
  e exportar um relatório em Markdown.
- `qa/`: ativos iniciais baseados no repositório para a tarefa de abertura e cenários
  básicos de QA.
- [Mantis](/pt-BR/concepts/mantis): verificação em tempo real antes/depois para bugs que
  exigem transportes reais, capturas de tela do navegador, estado da VM e evidências da PR.

## Superfície de comandos

Todo fluxo de QA é executado em `pnpm openclaw qa <subcommand>`. Muitos têm aliases de script
`pnpm qa:*`; ambas as formas funcionam.

| Comando                                             | Finalidade                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverificação de QA integrada sem `--qa-profile`; executor de perfil de maturidade baseado em taxonomia com `--qa-profile smoke-ci`, `--qa-profile release` ou `--qa-profile all`.                                                                                |
| `qa suite`                                          | Executa cenários baseados no repositório na via do gateway de QA. `--runner multipass` usa uma VM Linux descartável em vez do host.                                                                                                                                  |
| `qa coverage`                                       | Exibe o inventário YAML de cobertura de cenários (`--json` para saída de máquina; `--match <query>` para encontrar cenários de um comportamento alterado; `--tools` para cobertura de fixtures de ferramentas de runtime).                                  |
| `qa parity-report`                                  | Compara dois arquivos `qa-suite-summary.json` para um gate de paridade no eixo de modelos ou usa `--runtime-axis --token-efficiency` para gravar relatórios de paridade de runtime e eficiência de tokens entre Codex e OpenClaw.                                            |
| `qa confidence-report`                              | Classifica artefatos de evidência de QA em relação a um manifesto, gerando um relatório de confiança com zero itens desconhecidos.                                                                                                                                     |
| `qa confidence-self-test`                           | Grava canários de controle negativo com dados iniciais, comprovando que o gate de confiança detecta desvios.                                                                                                                                                           |
| `qa jsonl-replay`                                   | Reproduz transcrições JSONL selecionadas por meio da estrutura de reprodução de paridade de runtime.                                                                                                                                                                  |
| `qa character-eval`                                 | Executa o cenário de QA de personagem em vários modelos em tempo real com um relatório avaliado. Consulte [Relatórios](#reporting).                                                                                                                                   |
| `qa manual`                                         | Executa um prompt avulso na via do provedor/modelo selecionado.                                                                                                                                                                                                       |
| `qa ui`                                             | Inicia a interface do depurador de QA e o barramento de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                                                                          |
| `qa docker-build-image`                             | Compila a imagem Docker de QA pré-preparada.                                                                                                                                                                                                                          |
| `qa docker-scaffold`                                | Grava uma estrutura inicial do docker-compose para o painel de QA + a via do gateway.                                                                                                                                                                                  |
| `qa up`                                             | Compila o site de QA, inicia a pilha baseada em Docker e exibe a URL (alias: `pnpm qa:lab:up`; a variante `:fast` adiciona `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                     |
| `qa aimock`                                         | Inicia apenas o servidor do provedor AIMock.                                                                                                                                                                                                                          |
| `qa mock-openai`                                    | Inicia apenas o servidor do provedor `mock-openai` sensível a cenários.                                                                                                                                                                                               |
| `qa credentials doctor` / `add` / `list` / `remove` | Gerencia o pool compartilhado de credenciais do Convex.                                                                                                                                                                                                               |
| `qa discord`                                        | Via de transporte em tempo real em um canal real de guilda privada do Discord.                                                                                                                                                                                        |
| `qa matrix`                                         | Perfis do Matrix no QA Lab em um homeserver Tuwunel descartável. Consulte [Vias de smoke do Matrix](#matrix-smoke-lanes).                                                                                                                                             |
| `qa slack`                                          | Via de transporte em tempo real em um canal privado real do Slack.                                                                                                                                                                                                    |
| `qa telegram`                                       | Via de transporte em tempo real em um grupo privado real do Telegram.                                                                                                                                                                                                 |
| `qa whatsapp`                                       | Via de transporte em tempo real em contas reais do WhatsApp Web.                                                                                                                                                                                                      |
| `qa mantis`                                         | Executor de verificação antes/depois para bugs de transporte em tempo real, com evidências de reações de status do Discord, smoke de desktop/navegador no Crabbox e smoke do Slack em VNC. Consulte [Mantis](/pt-BR/concepts/mantis) e o [Runbook do Mantis para Slack Desktop](/pt-BR/concepts/mantis-slack-desktop-runbook). |

### `qa run` baseado em perfil

O `qa run` baseado em perfil lê a associação em `taxonomy.yaml` e então encaminha
os cenários resolvidos por meio de `qa suite`. `--surface` e `--category` filtram
o perfil selecionado em vez de definir vias separadas. O
`qa-evidence.json` resultante inclui um resumo do placar do perfil com contagens
das categorias selecionadas e IDs de cobertura ausentes; as entradas individuais de evidência continuam sendo a
fonte da verdade para os testes, as funções de cobertura e os resultados. Os IDs de cobertura
de recursos da taxonomia são alvos exatos de comprovação, não aliases: a cobertura primária de cenário
atende aos IDs correspondentes, enquanto a cobertura secundária permanece apenas informativa. Os IDs de cobertura usam
o formato pontilhado `namespace.behavior`, com segmentos alfanuméricos em minúsculas ou com hífen;
os IDs de perfil, superfície e categoria ainda podem usar os IDs de taxonomia existentes,
com hífen ou pontilhados.

A evidência reduzida omite `execution` por entrada e define `evidenceMode: "slim"`;
`smoke-ci` usa o formato reduzido por padrão, e `--evidence-mode full` restaura as entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Use `smoke-ci` para comprovação determinística de perfil com provedores de modelo simulados e
servidores de provedor local Crabline. Use `release` para comprovação Stable/LTS em
canais em tempo real. Use `all` somente para execuções explícitas de evidência da taxonomia completa; ele
seleciona todas as categorias de maturidade ativas e pode ser encaminhado pelo fluxo de trabalho
`QA
Profile Evidence` do GitHub Actions com `qa_profile=all`. Quando um
comando também precisar de um perfil raiz do OpenClaw, coloque o perfil raiz antes do
comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Fluxo do operador

O fluxo atual do operador de QA é um site de QA com dois painéis:

- À esquerda: painel do Gateway (Control UI) com o agente.
- À direita: QA Lab, exibindo a transcrição semelhante ao Slack e o plano de cenário.

Execute-o com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a via do gateway baseada em Docker e disponibiliza
a página do QA Lab, na qual um operador ou loop de automação pode atribuir ao agente uma missão de
QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para iterar mais rapidamente na interface do QA Lab sem recompilar a imagem Docker a cada vez,
inicie a pilha com um pacote do QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e
monta por bind `extensions/qa-lab/web/dist` no contêiner `qa-lab`.
`qa:lab:watch` recompila esse pacote quando há alterações, e o navegador recarrega automaticamente
quando o hash dos ativos do QA Lab muda.

### Smokes de observabilidade

<Note>
O QA de observabilidade permanece disponível somente no checkout do código-fonte. O tarball npm omite
intencionalmente o QA Lab (e `qa-channel`), portanto as vias de lançamento
Docker do pacote não executam comandos `qa`. Execute-os a partir de um checkout do código-fonte compilado ao
alterar a instrumentação de diagnóstico.
</Note>

| Alias                                   | O que executa                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Receptor OpenTelemetry local mais o cenário `otel-trace-smoke` com `diagnostics-otel` habilitado.                                      |
| `pnpm qa:otel:collector-smoke`          | A mesma lane por trás de um contêiner Docker real do OpenTelemetry Collector. Use-a ao alterar a conexão de endpoints ou a compatibilidade com o coletor/OTLP. |
| `pnpm qa:prometheus:smoke`              | O cenário `docker-prometheus-smoke` com `diagnostics-prometheus` habilitado.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` seguido por `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` seguido por `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` inicia um receptor OTLP/HTTP local, executa um turno mínimo
de agente do canal de QA e, em seguida, confirma que rastros, métricas e logs
são exportados. Ele decodifica os spans de rastreamento protobuf exportados e
verifica a estrutura crítica para a versão:
`openclaw.run`, `openclaw.harness.run`, um span de chamada de modelo da
convenção semântica GenAI mais recente, `openclaw.context.assembled` e `openclaw.message.delivery`
devem estar todos presentes. O smoke força
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, portanto, o span de chamada de
modelo deve usar o nome `{gen_ai.operation.name} {gen_ai.request.model}`; chamadas de
modelo não devem exportar `StreamAbandoned` em turnos bem-sucedidos; IDs brutos
de diagnóstico e atributos `openclaw.content.*` devem permanecer fora do rastro.
O prompt do cenário solicita que o modelo responda com um marcador fixo e
omita uma string secreta fixa; os payloads OTLP brutos não devem conter nenhum
dos dois, nem a chave da sessão de QA derivada do ID do cenário. Ele grava
`otel-smoke-summary.json` junto aos artefatos da suíte de QA.

`qa:prometheus:smoke` verifica se coletas não autenticadas são rejeitadas e,
em seguida, confirma que a coleta autenticada inclui famílias de métricas
críticas para a versão sem conteúdo do prompt, conteúdo da resposta,
identificadores brutos de diagnóstico, tokens de autenticação ou caminhos
locais.

### Lanes de smoke do Matrix

Para uma lane de smoke do Matrix com transporte real que não exige credenciais
do provedor de modelo, execute o perfil de versão com o provedor OpenAI simulado
e determinístico:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Para a lane do provedor de fronteira ao vivo, forneça explicitamente credenciais
compatíveis com OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

`pnpm openclaw qa matrix` simples executa o perfil `all` completo e continua
após falhas de cenário. Use `--fail-fast` para um ciclo de feedback mais
curto ou repita `--scenario <id>` para selecionar cenários individuais; IDs de
cenário explícitos têm precedência sobre `--profile`.

| Perfil       | Cenários  | Finalidade                                                                                                                               |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Catálogo completo (padrão).                                                                                                              |
| `release`    | 2         | Linha de base de canal crítica para a versão e recarregamento ao vivo da lista de permissões.                                             |
| `fast`       | 12        | Cobertura focada de threads, reações, aprovações, políticas, bloqueio de bots e respostas criptografadas.                                |
| `transport`  | 50        | Threads, roteamento de MD/sala, entrada automática, aprovações, reações, reinicializações, políticas de menção/lista de permissões, edições e ordenação de múltiplos atores. |
| `media`      | 7         | Cobertura de imagens, imagens geradas, voz, anexos, mídia não compatível e mídia criptografada.                                           |
| `e2ee-smoke` | 8         | Cobertura mínima de resposta criptografada, threads, inicialização, recuperação, reinicialização, redação e falhas.                        |
| `e2ee-deep`  | 18        | Perda de estado, backup, recuperação de chaves, higiene de dispositivos e verificação por SAS/QR/MD.                                      |
| `e2ee-cli`   | 9         | `openclaw matrix encryption setup`, chave de recuperação, múltiplas contas, ida e volta pelo Gateway e comandos de autoverificação por meio do harness. |

A associação aos perfis e os requisitos do canal ficam junto aos cenários
declarativos do Matrix em `qa/scenarios/channels/`. A execução escolhe o driver
do canal. As implementações ao vivo ficam em
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

O adaptador provisiona um homeserver Tuwunel descartável no Docker (imagem
padrão `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome do servidor `matrix-qa.test`,
porta `28008`), registra usuários temporários de driver, SUT e
observador, prepara as salas necessárias e registra o limite de
solicitação/resposta com redação. Em seguida, ele executa o Plugin real do
Matrix dentro de um Gateway de QA filho com escopo restrito a esse transporte
(sem `qa-channel`) e desmonta o ambiente.

Opções comuns:

| Flag                     | Padrão            | Finalidade                                                                            |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------- |
| `--profile <profile>`    | `all`             | Selecionar um dos perfis acima.                                                       |
| `--scenario <id>`        | -                 | Selecionar um cenário; pode ser repetido.                                             |
| `--fail-fast`            | desativado        | Parar após a primeira verificação ou o primeiro cenário com falha.                    |
| `--allow-failures`       | desativado        | Gravar artefatos sem retornar um código de saída de falha para falhas de cenário.     |
| `--provider-mode <mode>` | `live-frontier`   | Usar `mock-openai` para despacho determinístico ou `live-frontier` para um provedor ao vivo. |
| `--model <ref>`          | padrão do provedor | Definir a referência `provider/model` principal.                                    |
| `--alt-model <ref>`      | padrão do provedor | Definir o modelo alternativo usado por cenários que alternam modelos.                 |
| `--fast`                 | desativado        | Habilitar o modo rápido do provedor quando compatível.                                |
| `--output-dir <path>`    | gerado            | Escolher o diretório de relatórios; caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`     | diretório atual  | Executar a partir de um diretório de trabalho neutro.                                 |
| `--sut-account <id>`     | `sut`             | Selecionar o ID da conta do Matrix na configuração do Gateway filho.                  |

O QA do Matrix não aluga credenciais compartilhadas do Matrix: o adaptador cria
usuários descartáveis localmente, portanto, não aceita `--credential-source` nem
`--credential-role`. Substitua a imagem do homeserver com
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; ajuste as asserções negativas de ausência de resposta com
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (padrão `8000`, limitado ao tempo limite do
cenário ativo). Normalmente, o comando de execução única força uma saída limpa
após o descarregamento dos artefatos, pois os handles nativos de criptografia
do Matrix podem permanecer ativos após a limpeza; defina
`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` apenas para um harness de teste direto que
precise que o comando retorne em vez disso.

Cada execução grava os artefatos normais do QA Lab no diretório de saída
selecionado: `qa-suite-report.md`, `qa-suite-summary.json`, `qa-evidence.json`
e um manifesto `matrix-harness-*/matrix-qa-harness.json` com redação. Se a
limpeza falhar, execute o comando de recuperação
`docker compose ... down --remove-orphans` exibido. Em executores lentos, aumente
a janela de ausência de resposta; em CI rápida, uma janela menor pode reduzir
a duração das asserções negativas.

Os cenários cobrem comportamentos de transporte que testes unitários não podem
comprovar de ponta a ponta: bloqueio por menção, políticas de permissão de bots,
listas de permissões, respostas de nível superior e em threads, roteamento de
MD, tratamento de reações, supressão de edições recebidas, eliminação de
duplicatas de repetição após reinicialização, recuperação após interrupção do
homeserver, entrega de metadados de aprovação, tratamento de mídia e fluxos de
inicialização/recuperação/verificação de E2EE do Matrix. O perfil de CLI de
E2EE também conduz `openclaw matrix encryption setup` e comandos de
verificação pelo mesmo homeserver descartável antes de verificar as respostas
do Gateway.

`matrix-room-block-streaming` e `subagent-thread-spawn` continuam disponíveis por
seleção explícita de `--scenario`, mas permanecem fora do perfil
`all` padrão.

A CI usa a mesma superfície de comandos em
`.github/workflows/qa-live-transports-convex.yml`. Execuções agendadas e de versão
executam os cenários de versão. Despachos manuais de `matrix_profile=all`
distribuem os perfis `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` e `e2ee-cli`;
despachos focados selecionam `fast`, `release` ou
`transport` em um único job.

### Cenários Mantis do Discord

O Discord também possui cenários opcionais exclusivos do Mantis para reprodução
de bugs. Use `--scenario discord-status-reactions-tool-only` para a linha do tempo explícita
de reações de status ou `--scenario discord-thread-reply-filepath-attachment`
para criar uma thread real do Discord e verificar se `message.thread-reply`
preserva um anexo `filePath`. Esses cenários permanecem fora da lane
padrão ao vivo do Discord porque são sondagens de reprodução antes/depois, em
vez de uma ampla cobertura de smoke. O fluxo de trabalho Mantis de anexo em
thread também pode adicionar um vídeo de testemunho do Discord Web com sessão
iniciada quando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` ou
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` estiver configurado no ambiente
de QA. Esse perfil de visualizador serve apenas para captura visual; a decisão
de aprovação/reprovação ainda vem do oráculo REST do Discord.

Para as outras lanes de smoke com transporte real:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Elas têm como alvo um canal real preexistente com dois bots ou contas (driver +
SUT). As variáveis de ambiente necessárias, listas de cenários, artefatos de
saída e o pool de credenciais Convex para esses quatro transportes estão
documentados na
[referência de QA do Discord, Slack, Telegram e WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
abaixo.

### Executores de desktop do Slack e tarefas visuais do Mantis

Para uma execução completa em VM do desktop do Slack com recuperação por VNC,
execute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Esse comando concede uma máquina Crabbox com desktop/navegador, executa a
pista ao vivo do Slack dentro da VM, abre o Slack Web no navegador VNC, captura
o desktop e copia `slack-qa/`, `slack-desktop-smoke.png` e
`slack-desktop-smoke.mp4` (quando a captura de vídeo está disponível) de volta para o
diretório de artefatos do Mantis. As concessões de desktop/navegador do Crabbox
fornecem previamente as ferramentas de captura e os pacotes auxiliares do
navegador/build nativo, portanto o cenário só deve instalar alternativas em
concessões mais antigas. O Mantis informa os tempos total e por fase em
`mantis-slack-desktop-smoke-report.md`, para que execuções lentas mostrem se o tempo foi gasto no
aquecimento da concessão, na obtenção de credenciais, na configuração remota ou
na cópia de artefatos. Reutilize `--lease-id <cbx_...>` após iniciar sessão
manualmente no Slack Web por meio do VNC; concessões reutilizadas também mantêm
aquecido o cache do armazenamento pnpm do Crabbox. O `--hydrate-mode source` padrão
faz a verificação a partir de um checkout do código-fonte e executa a
instalação/build dentro da VM. Use `--hydrate-mode prehydrated` somente quando o espaço
de trabalho remoto reutilizado já tiver `node_modules` e um
`dist/` compilado; esse modo ignora a etapa dispendiosa de
instalação/build e falha de forma segura quando o espaço de trabalho não está
pronto. Com `--gateway-setup`, o Mantis deixa um Gateway persistente do Slack
do OpenClaw em execução dentro da VM na porta `38973`; sem essa
opção, o comando executa a pista normal de QA de bot para bot do Slack e sai
após a captura dos artefatos.

Para comprovar a interface nativa de aprovação do Slack com evidências do
desktop, execute o modo de pontos de verificação de aprovação do Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Esse modo é mutuamente exclusivo com `--gateway-setup`. Ele executa os
cenários de aprovação do Slack, rejeita IDs de cenários que não sejam de
aprovação, aguarda em cada estado de aprovação pendente e resolvido, renderiza
a mensagem observada da API do Slack em `approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png` e, em seguida, falha se algum ponto de verificação,
evidência de mensagem, confirmação ou captura de tela renderizada estiver
ausente ou vazio. Concessões frias de CI ainda podem mostrar o início de sessão
do Slack em `slack-desktop-smoke.png`; as imagens dos pontos de verificação de
aprovação são a comprovação visual dessa pista.

A execução padrão dos pontos de verificação mantém os dois cenários padrão de
aprovação do Slack. Para capturar qualquer uma das rotas opcionais de aprovação
do Codex, selecione-a explicitamente com `--scenario slack-codex-approval-exec-native` ou
`--scenario slack-codex-approval-plugin-native`; o Mantis aceita ambas e gera o mesmo par de capturas de tela
de estado pendente/resolvido. O executor amplia os prazos dos pontos de
verificação e dos comandos remotos para cada rota do Codex selecionada, para
que a sequência completa de aprovação, conclusão do agente e atualização do
estado resolvido possa terminar.

A lista de verificação do operador, o comando de despacho do fluxo de trabalho
do GitHub, o contrato de comentários de evidência, a tabela de decisão do modo
de hidratação, a interpretação dos tempos e as etapas de tratamento de falhas
estão no
[Runbook de desktop do Slack no Mantis](/pt-BR/concepts/mantis-slack-desktop-runbook).

Para uma tarefa de desktop no estilo agente/visão computacional, execute:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` concede ou reutiliza uma máquina Crabbox com
desktop/navegador, inicia `crabbox record --while`, controla o navegador visível por
meio de um `visual-driver` aninhado, captura `visual-task.png`, executa
`openclaw infer image
describe` na captura de tela quando `--vision-mode image-describe` está
selecionado e grava `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e
`mantis-visual-task-report.md`. Quando `--expect-text` está definido, o prompt de visão
solicita um veredito JSON estruturado (`visible`,
`evidence`, `reason`) e só é aprovado quando o modelo informa
`visible: true` com evidências que citam o texto esperado; uma resposta
`visible: false` que apenas cita o texto-alvo ainda falha na asserção. Use
`--vision-mode metadata` para um teste de fumaça sem modelo que comprove o
funcionamento do desktop, navegador, captura de tela e vídeo sem chamar um
provedor de compreensão de imagens. A gravação é um artefato obrigatório para
`visual-task`; se o Crabbox não gravar um `visual-task.mp4` não vazio, a
tarefa falhará mesmo que o controlador visual tenha sido aprovado. Em caso de
falha, o Mantis mantém a concessão para VNC, exceto se a tarefa já tiver sido
aprovada e `--keep-lease` não estiver definido.

### Verificação da integridade do pool de credenciais

Antes de usar credenciais ao vivo compartilhadas, execute:

```bash
pnpm openclaw qa credentials doctor
```

O doctor verifica as variáveis de ambiente do broker Convex
(`OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), valida as configurações do endpoint,
informa apenas o status definido/ausente de `OPENCLAW_QA_CONVEX_SECRET_CI` e
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` e verifica a acessibilidade de administração/listagem quando
o segredo do mantenedor está presente.

## Cobertura canônica de cenários

O `taxonomy.yaml` raiz define IDs de cobertura semântica. Os arquivos YAML
de cenários em `qa/scenarios/` mapeiam cada cenário para esses IDs e
controlam os metadados de execução: `channel` é o único requisito de
canal, e `profiles` declaram a associação a execuções nomeadas. O
controlador de canal é uma opção de implementação intercambiável no nível da
execução. Os executores TypeScript consultam esse catálogo; eles não mantêm
inventários paralelos de cenários ou cobertura.

A saída estática de `qa coverage` informa o mapeamento da taxonomia para
os cenários. A comprovação real vem de `qa-evidence.json`, que registra o
cenário executado, os IDs de cobertura, o canal, o controlador efetivamente
usado e o resultado. Canal e controlador são dimensões do relatório, não
vocabulários adicionais de IDs de cobertura nem eixos de elegibilidade de
cenários.

Para uma pista de VM Linux descartável sem introduzir o Docker no caminho de
QA, execute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Isso inicializa um convidado Multipass novo, instala as dependências, compila
o OpenClaw dentro do convidado, executa `qa suite` e copia o relatório
e o resumo normais de QA de volta para `.artifacts/qa-e2e/...` no host. Ele
reutiliza o mesmo comportamento de seleção de cenários que
`qa suite` no host.

Por padrão, as execuções da suíte no host e no Multipass executam vários
cenários selecionados em paralelo, com workers de Gateway isolados.
`qa-channel` usa por padrão simultaneidade 4, limitada pela quantidade de
cenários selecionados. Use `--concurrency
<count>` para ajustar a quantidade de
workers ou `--concurrency 1` para execução serial. Use
`--pack personal-agent` para executar o pacote de benchmarks do assistente pessoal
(10 cenários). O seletor de pacotes é aditivo com flags
`--scenario` repetidas: os cenários explícitos são executados primeiro e,
depois, os cenários do pacote são executados na ordem do pacote, com as
duplicatas removidas. Use `--pack observability` para selecionar os cenários
`otel-trace-smoke` e `docker-prometheus-smoke` em conjunto quando um executor de QA
personalizado já fornece a configuração do coletor OpenTelemetry.

O comando sai com código diferente de zero quando qualquer cenário falha. Use
`--allow-failures` quando quiser os artefatos sem um código de saída de falha.

As execuções ao vivo encaminham as entradas de autenticação de QA compatíveis
que são práticas para o convidado: chaves de provedores baseadas em variáveis
de ambiente, o caminho de configuração do provedor ao vivo de QA e
`CODEX_HOME`, quando presente. Mantenha `--output-dir` sob a raiz do
repositório para que o convidado possa gravar de volta por meio do espaço de
trabalho montado.

## Referência de QA do Discord, Slack, Telegram e WhatsApp

O adaptador Matrix usa a pista descartável baseada em Docker documentada
anteriormente. Discord, Slack, Telegram e WhatsApp são executados em
transportes reais preexistentes, portanto sua referência está aqui.

### Flags compartilhadas da CLI

Essas pistas são registradas por meio de
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e
aceitam as mesmas flags:

| Flag                                  | Padrão                                             | Descrição                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Executa somente este cenário. Pode ser repetida.                                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Local onde são gravados relatórios, resumos, evidências, artefatos específicos do transporte e o log de saída. Caminhos relativos são resolvidos em relação a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Raiz do repositório ao invocar a partir de um diretório de trabalho neutro.                                                                     |
| `--sut-account <id>`                  | `sut`                                              | ID da conta temporária na configuração do Gateway de QA.                                                                                        |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` ou `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | padrão do provedor                                 | Referências dos modelos primário/alternativo.                                                                                                   |
| `--fast`                              | desativado                                         | Modo rápido do provedor, quando compatível.                                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                              | Consulte [Pool de credenciais do Convex](#convex-credential-pool).                                                                               |
| `--credential-role <maintainer\|ci>`  | `ci` em CI, caso contrário `maintainer`                 | Função usada quando `--credential-source convex`.                                                                                                    |
| `--allow-failures`                    | desativado                                         | Grava artefatos sem retornar um código de saída de falha quando os cenários falham.                                                              |

Cada pista sai com código diferente de zero quando qualquer cenário falha.
`--allow-failures` grava artefatos sem definir um código de saída de falha. O
Telegram também aceita `--list-scenarios` para exibir os IDs de cenários
disponíveis e sair; as outras pistas não expõem essa flag.

### QA do Telegram

```bash
pnpm openclaw qa telegram
```

Tem como destino um grupo privado real do Telegram com dois bots distintos
(controlador + SUT). O bot SUT deve ter um nome de usuário do Telegram; a
observação de bot para bot funciona melhor quando ambos os bots têm o
**Bot-to-Bot Communication Mode** ativado em `@BotFather`.

Variáveis de ambiente obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numérico do chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

O perfil `release` seleciona os cenários YAML mantidos do Telegram;
`all` adiciona verificações opcionais de sessão, uso, cadeia de
respostas e estresse de streaming. Valores explícitos de `--scenario`
substituem o perfil.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

O perfil `release` sempre abrange canário, controle por menção, respostas de comandos
nativos, endereçamento de comandos e respostas entre bots em grupos. `mock-openai`
também inclui a verificação determinística da prévia final longa.
`telegram-current-session-status-tool` e
`telegram-tool-only-usage-footer` continuam opcionais: o primeiro só é estável
quando encadeado diretamente após o canário, e o segundo é uma comprovação no Telegram real
do rodapé `/usage` em respostas somente de ferramentas. Use `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` para imprimir a divisão
atual entre padrão/opcional com referências de regressão. Use `--profile all` em todos os
cenários do adaptador ativo do Telegram.

Artefatos de saída:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entradas de evidência para as verificações do transporte ativo,
  incluindo campos de perfil, cobertura, provedor, canal, artefatos, resultado e RTT.

As execuções do pacote para Telegram usam o mesmo contrato de credenciais do Telegram. A medição
repetida de RTT faz parte da faixa ativa normal do pacote para Telegram; a distribuição
de RTT é incorporada a `qa-evidence.json` em `result.timing` para a
verificação de RTT selecionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Quando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` está definido, o wrapper ativo do pacote
obtém por concessão uma credencial `kind: "telegram"`, exporta as variáveis de ambiente do grupo, driver e bot
SUT concedidos para a execução do pacote instalado, envia Heartbeats para a concessão e a libera
no encerramento. Por padrão, o wrapper do pacote executa 20 verificações de RTT de
`channel-canary`, usa um tempo limite de RTT de 30s e a função do Convex
`maintainer` fora da CI quando o Convex está selecionado. Substitua
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
ou `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar a medição de RTT sem
criar um comando de RTT separado ou um formato de resumo específico do Telegram.

### QA do Discord

```bash
pnpm openclaw qa discord
```

Tem como alvo um canal privado real de uma guilda do Discord com dois bots: um bot driver
controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw
por meio do Plugin do Discord incluído. Verifica o tratamento de menções no canal, se
o bot SUT registrou o comando nativo `/help` no Discord e
cenários opcionais de evidência do Mantis.

Variáveis de ambiente obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corresponder ao ID de usuário do bot SUT
  retornado pelo Discord (caso contrário, a faixa falha imediatamente).

Opcional:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleciona o canal de voz/palco para
  `discord-voice-autojoin`; sem ele, o cenário seleciona o primeiro
  canal de voz/palco visível para o bot SUT.

Cenários de módulo YAML do Discord (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - cenário de voz opcional. É executado isoladamente, habilita
  `channels.discord.voice.autoJoin` e verifica se o estado de voz atual do bot SUT no
  Discord corresponde ao canal de voz/palco de destino. As credenciais do Discord no Convex
  podem incluir `voiceChannelId` opcionalmente; caso contrário, o adaptador do executor
  descobre o primeiro canal de voz/palco visível na guilda.
- `discord-status-reactions-tool-only` - cenário opcional do Mantis. É executado
  isoladamente porque muda o SUT para respostas sempre ativas e somente de ferramentas na guilda
  com `messages.statusReactions.enabled=true` e, em seguida, captura uma linha do tempo
  de reações via REST, além de artefatos visuais HTML/PNG. Os relatórios do Mantis de antes/depois
  também preservam os artefatos MP4 fornecidos pelo cenário como `baseline.mp4`
  e `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - cenário opcional do Mantis; consulte
  [Cenários do Mantis no Discord](#discord-mantis-scenarios).

Execute explicitamente o cenário de entrada automática em voz do Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Execute explicitamente o cenário de reações de status do Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefatos de saída:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entradas de evidência para as verificações do transporte ativo.
- `discord-qa-reaction-timelines.json` e
  `discord-status-reactions-tool-only-timeline.png` quando o cenário de reações de status
  é executado.

### QA do Slack

```bash
pnpm openclaw qa slack
```

Tem como alvo um canal privado real do Slack com dois bots distintos: um bot driver
controlado pelo harness e um bot SUT iniciado pelo Gateway filho do OpenClaw
por meio do Plugin do Slack incluído.

Variáveis de ambiente obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita pontos de verificação de aprovação
  visual para o Mantis. O adaptador grava `<scenario>.pending.json` e
  `<scenario>.resolved.json` e, em seguida, aguarda os arquivos `.ack.json` correspondentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` substitui o tempo limite
  de confirmação do ponto de verificação. O padrão é `120000`.

Cenários YAML canônicos expostos pelo adaptador ativo do Slack:

- `thread-follow-up`
- `thread-isolation`

Cenários de módulo YAML do Slack (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - sondagem opcional no Slack real que confirma que um
  canal configurado como desabilitado emite um aviso estruturado sem responder.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` e
  `slack-progress-commentary-verbose-dedupe` - sondagens opcionais no Slack real para
  controles independentes de comentários/progresso de ferramentas, o padrão legado
  quando a chave é omitida e o comportamento de entrega única quando o progresso detalhado durável está ativado.
- `slack-reaction-glyph-native` - cenário opcional ativo de reação da ferramenta de mensagens.
  Instrui o agente a transmitir exatamente o glifo `✅` e confirma que o Slack armazenou
  `white_check_mark` para o bot SUT na mensagem de destino.
- `slack-chart-presentation-native` - cenário opcional de gráfico portátil que
  verifica o bloco nativo `data_visualization` e o texto acessível exato.
- `slack-table-presentation-native` - cenário opcional de tabela portátil que
  verifica o bloco nativo `data_table`, as linhas exatas e o texto acessível.
- `slack-table-invalid-blocks-fallback` - cenário opcional de transporte direto
  que envia uma tabela bruta estruturalmente legível acima do limite, com 101 linhas de dados
  além do cabeçalho, pelo
  caminho de envio do Slack em produção, comprova que o próprio Slack retorna `invalid_blocks`
  e verifica se o fallback armazenado com formatação desabilitada está completo e não contém
  nenhum bloco de dados nativo. Os detalhes do cenário mantêm apenas evidências seguras de
  código de erro, contagem e valores booleanos.
- `slack-approval-exec-native` - cenário opcional de aprovação nativa de execução no Slack.
  Solicita uma aprovação de execução pelo Gateway, verifica se a mensagem do Slack
  contém botões nativos de aprovação, resolve a solicitação e verifica a atualização resolvida no Slack.
- `slack-approval-plugin-native` - cenário opcional de aprovação nativa de Plugin no Slack.
  Habilita simultaneamente o encaminhamento de aprovações de execução e de Plugin para que os eventos
  de Plugin não sejam suprimidos pelo roteamento de aprovações de execução e, em seguida, verifica o mesmo
  fluxo de interface nativa pendente/resolvido no Slack.
- `slack-codex-approval-exec-native` - cenário de aprovação de comandos do Codex Guardian
  opcional. Habilita o Plugin do Codex no modo Guardian, encaminha um turno
  de agente do Gateway originado no Slack pelo harness do servidor de aplicativo do Codex,
  aguarda a solicitação nativa de aprovação do Plugin no Slack para
  `openclaw-codex-app-server`, resolve-a e verifica se o turno do Codex
  termina com os marcadores esperados de saída de comando e do assistente.
- `slack-codex-approval-plugin-native` - cenário de aprovação de arquivos do Codex Guardian
  opcional. Usa uma instrução `apply_patch` fora do espaço de trabalho para que o Codex emita
  a rota de aprovação de alteração de arquivo do servidor de aplicativo e, em seguida, verifica o mesmo
  fluxo nativo de aprovação pendente/resolvido no Slack, o marcador final do assistente e o conteúdo exato
  do arquivo antes da limpeza.

Os cenários de aprovação do Codex exigem um `openai/*` ou `codex/*` `--model`, as
credenciais normais do modelo ativo e autenticação do Codex ou autenticação por chave de API aceita pelo Plugin do Codex.
Os detalhes do cenário incluem o método do servidor de aplicativo do Codex, a chave do modelo
Codex selecionado, o status final do turno do Codex e a verificação do marcador de operação, além dos
metadados de aprovação redigidos do Slack.

Artefatos de saída:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - entradas de evidência para as verificações do transporte ativo.
- `approval-checkpoints/` - somente quando o Mantis define
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contém o JSON do ponto de verificação,
  o JSON de confirmação e capturas de tela pendentes/resolvidas.

#### Configuração do workspace do Slack

A faixa precisa de dois aplicativos distintos do Slack em um workspace, além de um canal do qual ambos
os bots sejam membros:

- `channelId` - o ID `Cxxxxxxxxxx` de um canal para o qual ambos os bots foram
  convidados. Use um canal dedicado; a faixa publica mensagens a cada execução.
- `driverBotToken` - token do bot (`xoxb-...`) do aplicativo **Driver**.
- `sutBotToken` - token do bot (`xoxb-...`) do aplicativo **SUT**, que deve ser um
  aplicativo Slack diferente do driver para que seu ID de usuário do bot seja distinto.
- `sutAppToken` - token no nível do aplicativo (`xapp-...`) do aplicativo SUT com
  `connections:write`, usado pelo Socket Mode para que o aplicativo SUT possa receber eventos.

Prefira um workspace do Slack dedicado a QA em vez de reutilizar um workspace de
produção.

O manifesto do SUT abaixo restringe intencionalmente a instalação de produção do
Plugin do Slack incluído (`extensions/slack/src/setup-shared.ts:12`) às
permissões e aos eventos abrangidos pelo conjunto ativo de QA do Slack. Para a
configuração do canal de produção como os usuários a veem, consulte
[Configuração rápida do canal do Slack](/pt-BR/channels/slack#quick-setup); o par Driver/SUT de QA
é intencionalmente separado porque a faixa precisa de dois IDs distintos de usuários
de bot em um workspace.

**1. Crie o aplicativo Driver**

Acesse [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → escolha o workspace de QA, cole o manifesto a seguir
e, em seguida, selecione _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot driver de teste para a faixa ativa de QA do Slack no OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copie o _Bot User OAuth Token_ (`xoxb-...`) — ele se torna
`driverBotToken`. O driver só precisa publicar mensagens e identificar
a si mesmo; sem eventos e sem Socket Mode.

**2. Crie o aplicativo SUT**

Repita _Create New App → From a manifest_ no mesmo workspace. Este aplicativo de QA
usa intencionalmente uma versão mais restrita do manifesto de produção do
Plugin do Slack incluído (`extensions/slack/src/setup-shared.ts:12`): escopos
e eventos de reação são omitidos porque o conjunto ativo de QA do Slack ainda não abrange
o tratamento de reações.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "Conector OpenClaw QA SUT para o OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Depois que o Slack criar o aplicativo, faça duas coisas na página de configurações:

- _Install to Workspace_ → copie o _Bot User OAuth Token_ → ele se torna
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → adicione o
  escopo `connections:write` → salve → copie o valor `xapp-...` → ele
  se torna `sutAppToken`.

Verifique se os dois bots têm IDs de usuário distintos chamando `auth.test` em cada
token. O runtime diferencia o driver e o SUT pelo ID de usuário; reutilizar um aplicativo
para ambos fará o bloqueio por menção falhar imediatamente.

**3. Crie o canal**

No workspace de QA, crie um canal (por exemplo, `#openclaw-qa`) e convide os dois
bots de dentro do canal:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copie o ID `Cxxxxxxxxxx` em _channel info → About → Channel ID_ — ele
se torna `channelId`. Um canal público funciona; se usar um canal privado,
ambos os aplicativos já têm `groups:history`, portanto as leituras de histórico do harness
ainda serão bem-sucedidas.

**4. Registre as credenciais**

Há duas opções. Use variáveis de ambiente para depuração em uma única máquina (defina as quatro
variáveis `OPENCLAW_QA_SLACK_*` e passe `--credential-source env`) ou inicialize
o pool compartilhado do Convex para que a CI e outros mantenedores possam alugá-las.

Para o pool do Convex, grave os quatro campos em um arquivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Com `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
exportados no shell, registre e verifique:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Semente do pool de QA do Slack"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espere `count: 1`, `status: "active"`, sem o campo `lease`.

**5. Verifique de ponta a ponta**

Execute a lane localmente para confirmar que os dois bots conseguem se comunicar por meio do
broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Uma execução bem-sucedida termina em bem menos de 30 segundos, e `qa-suite-report.md`
mostra `slack-canary` e `slack-mention-gating` com o status `pass`. Se a
lane ficar travada por cerca de 90 segundos e encerrar com `Convex credential pool exhausted
for kind "slack"`, o pool está vazio ou todas as linhas estão alugadas — `qa
credentials list --kind slack --status all --json` indicará qual é o caso.

### QA do WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Tem como alvo duas contas dedicadas do WhatsApp Web: uma conta de driver controlada pelo
harness e uma conta SUT iniciada pelo Gateway filho do OpenClaw por meio
do Plugin integrado do WhatsApp.

Variáveis de ambiente obrigatórias quando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita cenários de grupo, como
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, cenários de ações/mídia/enquetes em grupo
  e `whatsapp-group-allowlist-block`.

Cenários YAML do WhatsApp (`qa/scenarios/channels/whatsapp-*.yaml`):

- Linha de base e bloqueio de grupo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamento de resposta e saída final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Ações de mensagem pelo caminho do usuário: `whatsapp-agent-message-action-react` começa
  em uma DM real do driver, permite que o modelo chame a ferramenta `message` e
  observa a reação nativa do WhatsApp. `whatsapp-agent-message-action-upload-file`
  usa a mesma abordagem para `message(action=upload-file)` e observa
  mídia nativa do WhatsApp. `whatsapp-group-agent-message-action-react` e
  `whatsapp-group-agent-message-action-upload-file` comprovam as mesmas
  ações visíveis ao usuário em um grupo real do WhatsApp.
- Distribuição em grupo: `whatsapp-broadcast-group-fanout` começa com uma mensagem
  de grupo do WhatsApp contendo uma menção e verifica respostas visíveis distintas de `main`
  e `qa-second`.
- Ativação de grupo: `whatsapp-group-activation-always` altera uma sessão real
  de grupo para `/activation always`, comprova que uma mensagem de grupo sem menção desperta
  o agente e depois restaura `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` cria uma resposta inicial do bot, envia uma resposta
  nativa com citação para ela sem uma menção explícita e verifica se o agente
  desperta com base nesse contexto de resposta.
- Mídia recebida e mensagens estruturadas: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Esses cenários enviam eventos reais de imagem, áudio, documento, localização, contato,
  figurinha e reação do WhatsApp por meio do driver.
- Sondagens diretas do contrato do Gateway: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Elas ignoram intencionalmente o prompting do modelo
  e comprovam deterministicamente os contratos `send`, `poll` e
  `message.action` do Gateway/canal.
- Cobertura do controle de acesso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprovações nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reações de status: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Atualmente, o catálogo contém 52 cenários. A lane padrão `live-frontier`
é mantida pequena, com 8 cenários, para uma cobertura rápida de smoke test. A lane
padrão `mock-openai` executa deterministicamente 39 cenários pelo transporte real do WhatsApp,
simulando apenas a saída do modelo; os cenários de aprovação e algumas
verificações mais pesadas/bloqueantes continuam explícitos pelo ID do cenário.

O driver de QA do WhatsApp observa eventos estruturados em tempo real (`text`, `media`,
`location`, `reaction` e `poll`) e pode enviar ativamente mídia, enquetes,
contatos, localizações e figurinhas. O QA Lab importa esse driver pela
superfície do pacote `@openclaw/whatsapp/api.js`, em vez de acessar arquivos privados
do runtime do WhatsApp. Para observações de grupo, `fromJid` é o JID do grupo,
enquanto `participantJid` e `fromPhoneE164` identificam o participante remetente.
O conteúdo das mensagens é ocultado por padrão. As sondagens diretas do Gateway de enquete, upload de arquivo,
mídia, enquete em grupo, mídia em grupo e formato de resposta são verificações de contrato
de transporte/API; elas não são tratadas como prova de que um prompt do usuário fez o
agente escolher a mesma ação. A comprovação de ações pelo caminho do usuário vem de cenários
como `whatsapp-agent-message-action-react` e
`whatsapp-group-agent-message-action-react`, nos quais o driver envia uma mensagem
normal do WhatsApp e o QA Lab observa o artefato nativo do WhatsApp resultante.
Os detalhes dos cenários do WhatsApp incluem a abordagem de cada cenário (`user-path`,
`direct-gateway` ou `native-approval`) para que as evidências não sejam confundidas com um
contrato mais forte do que aquele que realmente comprovam.

Artefatos de saída:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` — entradas de evidência para as verificações de transporte em tempo real.

### Pool de credenciais do Convex

As lanes do Discord, Slack, Telegram e WhatsApp podem alugar credenciais de um
pool compartilhado do Convex em vez de ler as variáveis de ambiente acima. Passe
`--credential-source convex` (ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
o QA Lab adquire uma locação exclusiva, envia Heartbeats durante a
execução e a libera ao encerrar. Os tipos do pool são `"discord"`, `"slack"`,
`"telegram"` e `"whatsapp"`.

Formatos de payload que o broker valida em `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` — `groupId` deve ser uma string numérica de ID de chat.
- Usuário real do Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` —
  somente para comprovação pelo Telegram Desktop do Mantis. As lanes genéricas do QA Lab não devem adquirir
  esse tipo.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` — os números de telefone devem ser strings E.164 distintas.

O fluxo de trabalho de comprovação pelo Telegram Desktop do Mantis mantém uma locação exclusiva
`telegram-user` do Convex tanto para o driver da CLI do TDLib quanto para a testemunha do Telegram Desktop
e a libera após publicar a comprovação.

Quando um PR precisa de um diff visual determinístico, o Mantis pode usar a mesma resposta
simulada do modelo em `main` e no head do PR enquanto o formatador ou
a camada de entrega do Telegram muda. Os padrões de captura são ajustados para comentários em PRs: classe
padrão do Crabbox, gravação da área de trabalho a 24fps, GIF de movimento a 24fps e prévia com
1920px de largura. Os comentários de antes/depois devem publicar um pacote limpo que contenha
apenas os GIFs pretendidos.

As lanes do Slack também podem usar o pool. Atualmente, as verificações do formato de payload do Slack ficam
no executor de QA do Slack, e não no broker; use `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, com um
ID de canal do Slack como `Cxxxxxxxxxx`. Consulte
[Como configurar o workspace do Slack](#setting-up-the-slack-workspace) para o provisionamento
do aplicativo e dos escopos.

As variáveis de ambiente operacionais e o contrato do endpoint do broker do Convex estão em
[Testes → Credenciais compartilhadas do Telegram via Convex](/pt-BR/help/testing#shared-telegram-credentials-via-convex-v1)
(o nome da seção é anterior ao pool multicanal; a semântica de locação é
compartilhada entre os tipos).

## Sementes armazenadas no repositório

Os ativos de semente ficam em `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Eles são mantidos intencionalmente no git para que o plano de QA seja visível tanto para pessoas quanto para
o agente.

`qa-lab` continua sendo um executor genérico de cenários YAML. Cada arquivo YAML de cenário é a
fonte da verdade para uma execução de teste e deve definir:

- `title` no nível superior
- metadados de `scenario`
- metadados opcionais de categoria, capacidade, lane e risco em `scenario`
- referências de documentação e código em `scenario`
- requisitos opcionais de Plugin em `scenario`
- patch opcional da configuração do Gateway em `scenario`
- `flow` executável no nível superior para cenários de fluxo, ou
  `scenario.execution.kind` / `scenario.execution.path` para cenários do Vitest e
  Playwright

A superfície de runtime reutilizável que sustenta `flow` permanece genérica e
transversal. Por exemplo, os cenários YAML podem combinar auxiliares do lado
do transporte com auxiliares do lado do navegador que controlam a Control UI
incorporada por meio da interface `browser.request` do Gateway, sem adicionar
um executor para casos especiais.

Os arquivos de cenário devem ser agrupados por capacidade do produto, e não
pela pasta da árvore de código-fonte. Mantenha os IDs dos cenários estáveis
quando os arquivos forem movidos; use `docsRefs` e
`codeRefs` para rastreabilidade da implementação.

A lista de referência deve permanecer ampla o suficiente para abranger:

- DM e conversa em canal
- comportamento de threads
- ciclo de vida das ações de mensagem
- callbacks de Cron
- recuperação de memória
- troca de modelo
- transferência para subagente
- leitura de repositório e documentação
- uma pequena tarefa de compilação, como Lobster Invaders

## Faixas de simulação de provedores

`qa suite` tem duas faixas locais de simulação de provedores:

- `mock-openai` é a simulação do OpenClaw com reconhecimento de cenários. Ela permanece como a faixa
  de simulação determinística padrão para QA baseada em repositório e verificações de paridade.
- `aimock` inicia um servidor de provedor baseado no AIMock para cobertura
  experimental de protocolo, fixtures, gravação/reprodução e caos. Ela é adicional e
  não substitui o despachante de cenários `mock-openai`.

A implementação das faixas de provedores fica em `extensions/qa-lab/src/providers/`.
Cada provedor é responsável por seus padrões, inicialização do servidor local,
configuração do modelo no Gateway, necessidades de preparação do perfil de
autenticação e sinalizadores de capacidade ao vivo/simulada. O código
compartilhado da suíte e do Gateway faz o roteamento pelo registro de
provedores, em vez de criar ramificações com base nos nomes dos provedores.

## Adaptadores de transporte

`qa-lab` fornece uma interface genérica de transporte para cenários de QA em YAML. `qa-channel` é
o padrão sintético. `crabline` inicia servidores locais com o formato dos provedores e
executa os plugins de canal normais do OpenClaw contra eles. `live` é reservado para
credenciais reais de provedores e canais externos.

No nível da arquitetura, a divisão é:

- `qa-lab` é responsável pela execução genérica de cenários, concorrência dos workers, gravação
  de artefatos e geração de relatórios.
- O adaptador de transporte é responsável pela configuração do Gateway, prontidão, observação
  de entrada e saída, ações de transporte e estado normalizado do transporte.
- Os arquivos de cenário YAML em `qa/scenarios/` definem a execução do teste; `qa-lab`
  fornece a superfície de runtime reutilizável que os executa.

### Como adicionar um canal

Adicionar um canal ao sistema de QA em YAML exige a implementação do canal,
além de um pacote de cenários que exercite o contrato do canal. Para cobertura
de fumaça em CI, adicione o servidor local do provedor Crabline correspondente
e exponha-o por meio do driver `crabline`.

Não adicione uma nova raiz de comandos de QA de nível superior quando o host
compartilhado `qa-lab` puder controlar o fluxo.

`qa-lab` é responsável pela mecânica do host compartilhado:

- a raiz de comandos `openclaw qa`
- inicialização e encerramento da suíte
- concorrência dos workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários `qa-channel` mais antigos

Os plugins de execução são responsáveis pelo contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como os eventos de entrada são injetados
- como as mensagens de saída são observadas
- como as transcrições e o estado normalizado do transporte são expostos
- como as ações baseadas em transporte são executadas
- como a redefinição ou limpeza específica do transporte é tratada

Os requisitos mínimos de adoção para um novo canal:

1. Mantenha `qa-lab` como responsável pela raiz compartilhada `qa`.
2. Implemente o executor de transporte na interface de host compartilhada `qa-lab`.
3. Mantenha a mecânica específica do transporte dentro do plugin de execução ou do
   harness do canal.
4. Monte o executor como `openclaw qa <runner>`, em vez de registrar uma
   raiz de comandos concorrente. Os plugins de execução devem declarar `qaRunners` em
   `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations`
   correspondente de `runtime-api.ts`. Mantenha `runtime-api.ts` leve; a CLI com carregamento
   tardio e a execução do executor devem permanecer atrás de pontos de entrada separados. Um
   `adapterFactory` opcional expõe o transporte aos cenários compartilhados sem alterar
   o catálogo de cenários existente do comando.
5. Crie ou adapte cenários YAML nos diretórios temáticos `qa/scenarios/`.
6. Use os auxiliares genéricos de cenário para novos cenários.
7. Mantenha os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja realizando uma
   migração intencional.

A regra de decisão é estrita:

- Se um comportamento puder ser expresso uma única vez em `qa-lab`, coloque-o em `qa-lab`.
- Se um comportamento depender do transporte de um canal, mantenha-o no plugin
  de execução ou no harness desse plugin.
- Se um cenário precisar de uma nova capacidade que possa ser usada por mais de um canal,
  adicione um auxiliar genérico em vez de uma ramificação específica do canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário
  específico do transporte e deixe isso explícito no contrato do cenário.

### Nomes dos auxiliares de cenário

Auxiliares genéricos preferenciais para novos cenários:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Os aliases de compatibilidade continuam disponíveis para cenários existentes —
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus` —, mas a criação de novos cenários
deve usar os nomes genéricos. Os aliases existem para evitar uma migração
simultânea e disruptiva, não como o modelo a ser seguido daqui em diante.

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada no barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

Para obter o inventário de cenários disponíveis — útil ao dimensionar o trabalho
de acompanhamento ou conectar um novo transporte —, execute `pnpm openclaw qa coverage` (adicione `--json`
para obter saída legível por máquina). Ao escolher uma comprovação focada para um
comportamento ou caminho de arquivo alterado, execute `pnpm openclaw qa coverage --match <query>`. O
relatório de correspondências pesquisa metadados de cenários, referências da documentação, referências de código, IDs de cobertura,
plugins e requisitos de provedores e, em seguida, exibe os alvos `qa suite
--scenario ...` correspondentes.

Cada execução de `qa suite` grava os artefatos de nível superior `qa-evidence.json`,
`qa-suite-summary.json` e `qa-suite-report.md` para o conjunto de
cenários selecionado. Os cenários que declaram `execution.kind: vitest` ou
`execution.kind: playwright` executam o caminho de teste correspondente e também gravam
logs por cenário. Os cenários que declaram `execution.kind: script` executam o
produtor de evidências em `execution.path` por meio de `node --import tsx` (com
`${outputDir}` e `${scenarioId}` expandidos em `execution.args`); o
produtor grava seu próprio `qa-evidence.json`, cujas entradas são importadas para
a saída da suíte e cujos caminhos de artefatos são resolvidos em relação ao
`qa-evidence.json` desse produtor. Quando `qa suite` é alcançado por meio de `qa run
--qa-profile`, o mesmo `qa-evidence.json` também inclui o resumo
do scorecard do perfil para as categorias de taxonomia selecionadas.

Trate a saída de cobertura como um auxílio de descoberta, não como substituta de uma
verificação; o cenário selecionado ainda precisa do modo de provedor, transporte
ao vivo, Multipass, Testbox ou faixa de lançamento apropriado para o comportamento
em teste. Para obter o contexto do scorecard, consulte [Scorecard de maturidade](/pt-BR/maturity/scorecard).

Para verificações de personalidade e estilo, execute o mesmo cenário em várias
referências de modelos ao vivo e grave um relatório Markdown avaliado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

O comando executa processos filhos locais do Gateway de QA, não o Docker. Os cenários
de avaliação de personalidade devem definir a persona por meio de `SOUL.md` e, em seguida, executar interações
comuns do usuário, como conversa, ajuda com o workspace e pequenas tarefas com arquivos. O modelo
candidato não deve ser informado de que está sendo avaliado. O comando preserva
cada transcrição completa, registra estatísticas básicas da execução e, em seguida, solicita aos modelos avaliadores no
modo rápido, com raciocínio `xhigh` quando houver suporte, que classifiquem as execuções por
naturalidade, estilo e humor. Use `--blind-judge-models` ao comparar
provedores: o prompt do avaliador ainda recebe todas as transcrições e os status das execuções, mas
as referências dos candidatos são substituídas por rótulos neutros, como `candidate-01`; o
relatório associa as classificações novamente às referências reais após a análise.

As execuções dos candidatos usam por padrão o raciocínio `high`, com `medium` para o GPT-5.6 Luna e
`xhigh` para referências de avaliação mais antigas da OpenAI que ofereçam suporte. Substitua a configuração de um
candidato específico diretamente com `--model provider/model,thinking=<level>`; as
opções embutidas também oferecem suporte a `fast`, `no-fast` e `fast=<bool>`. `--thinking
<level>` ainda define uma opção global de fallback, e a forma
mais antiga `--model-thinking
<provider/model=level>` é mantida para compatibilidade. As referências de candidatos da OpenAI
usam o modo rápido por padrão, para que o processamento prioritário seja usado quando o provedor
oferecer suporte. Passe `--fast` somente quando quiser forçar a ativação do modo rápido para
todos os modelos candidatos. As durações dos candidatos e avaliadores são registradas no
relatório para análise de benchmark, mas os prompts dos avaliadores dizem explicitamente para não classificar
por velocidade. As execuções dos modelos candidatos e avaliadores usam concorrência 16 por padrão.
Reduza `--concurrency` ou `--judge-concurrency` quando os limites do provedor ou a pressão sobre o
Gateway local tornarem uma execução ruidosa demais.

Quando nenhuma referência de candidato `--model` for passada, a avaliação de personalidade usa por padrão
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e `google/gemini-3.1-pro-preview`. Quando nenhum
`--judge-model` for passado, os avaliadores usam por padrão
`openai/gpt-5.6-sol,thinking=xhigh,fast` e
`anthropic/claude-opus-4-8,thinking=high`.

## Documentação relacionada

- [Scorecard de maturidade](/pt-BR/maturity/scorecard)
- [Pacote de benchmark para agente pessoal](/pt-BR/concepts/personal-agent-benchmark-pack)
- [Canal de QA](/pt-BR/channels/qa-channel)
- [Testes](/pt-BR/help/testing)
- [Painel](/pt-BR/web/dashboard)
