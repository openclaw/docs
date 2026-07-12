---
read_when:
    - Você quer uma linha do tempo do seu dia no estilo Dayflow na interface de controle
    - Você está ativando ou configurando o plugin Logbook incluído
    - Você quer resumos de reuniões diárias ou uma retrospectiva do dia com base na atividade da tela
summary: Diário de trabalho automático opcional criado a partir de capturas de tela periódicas
title: Plugin de diário de bordo
x-i18n:
    generated_at: "2026-07-12T15:28:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

O plugin Logbook transforma a atividade da tela em um diário de trabalho automático. Ele
captura instantâneos periódicos da tela de um Node pareado, resume-os em
observações com carimbo de data e hora e cria cartões de linha do tempo na
[Interface de Controle](/pt-BR/web/control-ui). Ele também pode gerar notas diárias para reuniões de acompanhamento e
responder a perguntas sobre um dia monitorado.

O estado pertencente ao OpenClaw permanece no Gateway em `<state-dir>/logbook/`, mas
o processamento pelos modelos não é necessariamente local. As capturas de tela amostradas são enviadas para a
rota de visão configurada; as observações e o texto da linha do tempo são enviados para o modelo
padrão do agente. Use rotas de modelos locais para ambas as etapas se o conteúdo da tela e
o texto de atividade derivado precisarem permanecer na máquina.

O Logbook vem incluído e desativado por padrão. Ativar o plugin permite que o
Gateway capture a tela, pois `captureEnabled` tem `true` como padrão.

## Antes de começar

Você precisa de:

- Um Node conectado que exponha `screen.snapshot` ou `logbook.snapshot`. O
  Node do aplicativo para macOS precisa da permissão Screen Recording. Um host de Node macOS sem interface gráfica
  (`openclaw node host run`) recebe o comando `logbook.snapshot`
  fornecido pelo plugin, que usa a ferramenta `screencapture` do sistema.
- O plugin Codex incluído ativado e autenticado. Atualmente, o Codex fornece
  o contrato de extração estruturada de imagens exigido pelo Logbook. Entre com
  `openclaw models auth login --provider openai`; consulte
  [Ambiente Codex](/pt-BR/plugins/codex-harness) para conhecer outros métodos de autenticação.
- Um modelo padrão de agente funcional. O Logbook o utiliza para sintetizar cartões, notas de
  acompanhamento e perguntas e respostas sobre o dia após a etapa de visão.

## Início rápido

Ative os plugins Codex e Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Configure um modelo de visão explícito para uma inicialização determinística:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Se você usar `plugins.allow`, inclua `codex` e `logbook`. Reinicie o
Gateway após alterar a configuração dos plugins, depois inspecione os registros
e abra o painel:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

A descrição do Node deve incluir `screen.snapshot` ou `logbook.snapshot`.
Nodes sem interface gráfica anunciam `logbook.snapshot` somente depois que o plugin está ativo.
Consulte [Solução de problemas de Nodes](/pt-BR/nodes/troubleshooting) se o comando não estiver disponível.

A aba Logbook aparece somente quando o plugin está ativado e a sessão da
Interface de Controle tem `operator.write`. A linha de status deve mostrar **Capturando** sem erros.
Um cartão da linha do tempo aparece quando a janela de análise é encerrada, ou você pode selecionar
**Analisar agora** após a captura de atividade.

## Como funciona

1. **Captura**: a cada `captureIntervalSeconds` (padrão de 30s), o Logbook invoca
   o comando de captura do Node selecionado e armazena um quadro JPEG redimensionado.
   Quadros consecutivos idênticos são marcados como ociosos e excluídos da análise.
2. **Observação**: quando uma janela de análise (padrão de 15 minutos) termina, o
   plugin seleciona até 16 quadros ativos e os envia ao modelo de visão,
   que retorna observações de atividade com carimbo de data e hora ("VS Code: editando
   store.ts, corrigindo um erro de tipo"). Uma lacuna de captura superior a dois minutos ou
   a meia-noite local também encerra a janela atual.
3. **Síntese**: as observações e os últimos 45 minutos de cartões existentes são
   revisados e transformados em cartões da linha do tempo (10-60 minutos cada), com título, resumo,
   categoria, aplicativo principal e eventuais distrações breves.
4. **Limpeza**: quadros mais antigos que `retentionDays` (padrão de 14) são excluídos.
   Cartões, observações e notas de acompanhamento armazenadas em cache são mantidos.

Os limites dos dias e os horários da linha do tempo usam o fuso horário local do Gateway, não o
fuso horário do navegador. Os quadros e o banco de dados SQLite da linha do tempo ficam em
`<state-dir>/logbook/`.

## Fluxo de modelos e dados

O Logbook usa duas rotas de modelos distintas:

| Etapa                    | Dados enviados                                                     | Rota do modelo                                                               |
| ------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Observar                 | Até 16 quadros JPEG selecionados e seus horários de captura        | `visionModel` ou uma entrada Codex `tools.media` compatível e reutilizada     |
| Sintetizar cartões       | Observações com carimbo de data e hora e cartões recentes da linha do tempo | Modelo padrão do agente pelo runtime de LLM do plugin                 |
| Gerar acompanhamento     | Cartões do dia selecionado e do dia anterior                       | Modelo padrão do agente pelo runtime de LLM do plugin                         |
| Perguntar sobre seu dia  | A pergunta, os cartões do dia selecionado e observações recentes   | Modelo padrão do agente pelo runtime de LLM do plugin                         |

O banco de dados SQLite completo não é enviado para nenhum dos modelos. As capturas de tela brutas são enviadas somente
para a etapa de observação; a síntese de cartões, o acompanhamento e as perguntas e respostas recebem texto
derivado.

## Configuração

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Todas as chaves de configuração do Logbook são opcionais. Os valores numéricos são arredondados para números inteiros
e limitados ao intervalo compatível.

| Chave                     | Padrão       | Intervalo ou valores          | Comportamento                                                                                              |
| ------------------------- | ------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`       | boolean                       | Chave mestra persistente para novos instantâneos; a linha do tempo permanece disponível quando `false`    |
| `captureIntervalSeconds`  | `30`         | `5`-`600`                     | Intervalo entre tentativas de captura                                                                      |
| `analysisIntervalMinutes` | `15`         | `3`-`120`                     | Janela de observação pretendida; lacunas e a meia-noite podem encerrá-la antes                             |
| `nodeId`                  | não definido | id ou nome de exibição do Node | Fixa a captura em um Node conectado; a correspondência não diferencia maiúsculas de minúsculas            |
| `screenIndex`             | `0`          | `0`-`16`                      | Índice da tela baseado em zero                                                                              |
| `maxWidth`                | `1440`       | `480`-`3840`                  | Limite de tamanho solicitado para a captura; o macOS sem interface gráfica o aplica à maior dimensão       |
| `visionModel`             | não definido | `provider/model`              | Rota estruturada explícita; referências malformadas pausam a análise, provedores incompatíveis falham lotes |
| `retentionDays`           | `14`         | `1`-`365`                     | Exclui quadros antigos; cartões, observações e acompanhamentos permanecem                                   |

Sem `nodeId`, o Logbook prefere um Node de aplicativo conectado que exponha
`screen.snapshot` e, em seguida, recorre a um Node sem interface gráfica que exponha
`logbook.snapshot`. Em uma configuração sem fixação, um Node que falhou passa para trás dos outros
Nodes elegíveis. A opção de pausa do painel vale somente para a sessão e é redefinida quando o
Gateway reinicia; use `captureEnabled: false` para uma interrupção persistente.

### Seleção do modelo de visão

O Logbook resolve o modelo de observação nesta ordem:

1. `plugins.entries.logbook.config.visionModel`
2. a primeira entrada Codex compatível com imagens em `tools.media.image.models`
3. a primeira entrada Codex compatível com imagens em `tools.media.models`

Outros provedores de mídia são ignorados porque atualmente não expõem o
contrato de extração estruturada exigido pelo Logbook. Definir
`tools.media.image.enabled: false` desativa os padrões de mídia reutilizados, mas um
`visionModel` explícito do Logbook ainda é aplicado.

## Aba do painel

- **Linha do tempo**: cartões expansíveis para cada atividade, com cores por categoria, o
  aplicativo principal, etiquetas de distração e um quadro-chave da captura.
- **Visão geral do dia**: proporção de foco, divisão por categoria e principais aplicativos.
- **Acompanhamento diário**: transforma ontem e hoje em uma atualização pronta para colar.
- **Pergunte sobre seu dia**: perguntas em linguagem natural respondidas com base na linha do tempo
  monitorada ("quando revisei o PR do Gateway?").
- **Analisar agora**: encerra imediatamente a janela de captura atual, em vez de
  aguardar o intervalo de análise.

## Métodos do Gateway

O Logbook registra estes métodos RPC do Gateway:

| Método                | Parâmetros               | Escopo           | Resultado                                                                         |
| --------------------- | ------------------------ | ---------------- | --------------------------------------------------------------------------------- |
| `logbook.status`      | nenhum                   | `operator.read`  | Status da captura, análise, modelo, Node, dia e fuso horário do Gateway            |
| `logbook.days`        | nenhum                   | `operator.read`  | Dias com contagens de cartões da linha do tempo e limites de horário dos cartões   |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Cartões derivados e estatísticas do dia; o padrão é o dia atual do Gateway        |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Metadados dos quadros no intervalo solicitado em milissegundos desde a época Unix |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Um quadro JPEG bruto em base64                                                     |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Texto de acompanhamento armazenado em cache ou gerado novamente para um dia       |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Resposta fundamentada na linha do tempo de um dia                                 |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Estado de pausa somente da sessão e status atualizado                             |
| `logbook.analyze.now` | nenhum                   | `operator.write` | Inicia uma análise pendente ou retorna o motivo pelo qual ela não pôde ser iniciada |

Os métodos de leitura retornam o estado operacional ou texto derivado. Pixels brutos de capturas de tela,
ações que geram gastos com modelos e mutações do runtime exigem
`operator.write`. A aba da Interface de Controle também exige `operator.write`, pois
expõe essas ações e prévias dos quadros brutos; um cliente somente leitura ainda pode chamar
diretamente os métodos de texto derivado.

## Observações sobre privacidade

- Os instantâneos podem conter qualquer conteúdo exibido na tela, incluindo segredos. Os quadros nunca
  saem da máquina, exceto como entrada amostrada para o modelo de observação
  configurado.
- Observações, cartões recentes e perguntas podem sair da máquina por meio do
  modelo padrão do agente durante a síntese de cartões, geração do acompanhamento ou perguntas e respostas. Aplique
  a política de tratamento de dados do provedor a ambas as rotas de modelos.
- Use rotas locais tanto para o modelo de observação estruturada quanto para o modelo padrão do
  agente quando precisar de um pipeline totalmente local.
- Os quadros, o banco de dados da linha do tempo e as capturas temporárias são gravados com
  permissões de arquivo exclusivas para o proprietário.
- Adicionar `screen.snapshot` a `gateway.nodes.denyCommands` é o
  interruptor de bloqueio da captura de tela: ele bloqueia tanto a captura por Nodes de aplicativo quanto o próprio
  comando `logbook.snapshot` do Logbook.
- Definir `tools.media.image.enabled: false` também impede que o Logbook reutilize
  os modelos de imagem de mídia para análise; nesse caso, somente um `visionModel` explícito na
  configuração do plugin é usado.

## Solução de problemas

### A aba Logbook não aparece

Verifique os três requisitos:

1. `openclaw plugins list --enabled` inclui `logbook`.
2. O Gateway foi reiniciado após a alteração do plugin ou da lista de permissões.
3. A conexão da Interface de Controle tem `operator.write`; sessões somente leitura não
   recebem o descritor da aba interativa.

Se `plugins.allow` estiver definido, ele deverá incluir `logbook` e `codex` para a
configuração recomendada.

### A captura relata um erro

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Confirme se o Node expõe `screen.snapshot` ou `logbook.snapshot`.
- Conceda permissão de Gravação de Tela no Mac de captura.
- Se `nodeId` estiver configurado, confirme se ele corresponde ao ID ou ao nome de exibição do Node.
- Verifique se `gateway.nodes.denyCommands` não contém
  `screen.snapshot`.

Após três falhas consecutivas, o Logbook aguarda dez ciclos de captura antes de
tentar novamente. Uma configuração sem Node fixado pode alternar para outro Node qualificado.

### As capturas são bem-sucedidas, mas nenhum cartão aparece

- Um status **Modelo ausente** significa que nenhuma rota compatível de visão estruturada foi
  encontrada. Ative e autentique o Plugin Codex ou defina um
  `visionModel` explícito válido. Os quadros capturados permanecem pendentes enquanto o modelo está ausente e
  podem ser analisados após a correção da configuração.
- Aguarde o `analysisIntervalMinutes` ou selecione **Analisar agora** após a captura
  de atividade.
- Quadros idênticos consecutivos são evidências de inatividade e não entram nos lotes
  de análise. Altere a tela visível antes de testar.
- Se o lote mais recente exibir um erro, corrija o problema do modelo ou de autenticação e selecione
  **Analisar agora**. Os lotes com falha são repetidos apenas com essa ação explícita para
  evitar gastos repetidos com o modelo.

## Relacionado

- [Gerenciar plugins](/pt-BR/plugins/manage-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Nodes](/pt-BR/nodes)
- [Solução de problemas de Nodes](/pt-BR/nodes/troubleshooting)
- [Interface de controle](/pt-BR/web/control-ui)
