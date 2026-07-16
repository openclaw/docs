---
read_when:
    - Operação ou depuração de workers na nuvem iniciados pelo Gateway
    - Verificação da admissão de workers, da atribuição de sessões ou do isolamento de ferramentas locais
summary: Referência interna do operador para o runtime restrito do worker de nuvem
title: Trabalhador
x-i18n:
    generated_at: "2026-07-16T12:22:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` é o ponto de entrada de runtime restrito que um orquestrador
de workers em nuvem inicia dentro de um ambiente de worker preparado. Ele não é
um comando de uso geral para o registro manual de workers.

O Gateway instala o pacote correspondente do OpenClaw e abre o túnel SSH reverso
com chave do host fixada. O inicializador de workers inicia este comando com uma
atribuição preparada. O comando se conecta pelo soquete local encaminhado pelo
túnel e é admitido com a função dedicada `worker`.

## Contrato de inicialização

O comando lê exatamente um envelope JSON de inicialização com tamanho limitado
da entrada padrão. O envelope contém a localização do soquete local, a credencial
de worker emitida, as identidades do pacote e do protocolo, a época do
proprietário e a única sessão e turno atribuídos. A credencial nunca é aceita por
argumentos de linha de comando, e esta página intencionalmente não fornece
exemplos de credencial nem de envelope criado manualmente.

A admissão falha de forma fechada se o envelope for inválido, a credencial for
rejeitada, os recursos do pacote ou do protocolo não corresponderem ou a sessão
e a época do proprietário não forem mais atuais. Os operadores devem iniciar os
workers pelo orquestrador de workers em nuvem, em vez de invocar este ponto de
entrada diretamente.

## Limite do runtime

O processo executa o loop normal do agente incorporado com um backend restrito:

- As ferramentas de programação `read`, `write`, `edit`, `apply_patch`, `exec` e `process`
  são executadas localmente no espaço de trabalho do worker.
- As chamadas ao modelo usam o proxy de inferência do Gateway. Nenhum perfil
  local de autenticação do modelo é carregado.
- As gravações da transcrição usam a RPC de confirmação de transcrição do Gateway.
- As atualizações de streaming e do ciclo de vida das ferramentas usam a RPC de eventos em tempo real do Gateway.
- Somente a sessão e o turno atribuídos são aceitos.

O modo worker não inicia canais, superfícies HTTP do Gateway nem a inicialização
automática de plugins além do conjunto de ferramentas da sessão atribuída. Ele
usa um diretório de estado descartável e não possui credenciais permanentes de
provedor nem de forge.

O despacho de sessões entre workers não é exposto neste modo. O posicionamento e
o despacho permanecem sob responsabilidade do Gateway: um operador pode
despachar pelo Gateway uma sessão local existente de árvore de trabalho
gerenciada, enquanto um processo de worker não pode despachar a si próprio nem
outro worker.

A atribuição preparada contém o contexto da transcrição, a folha-base aceita, a
sequência de confirmação e o cursor de eventos em tempo real. Quando o túnel é
reconectado, o processo é readmitido com a mesma credencial e época do
proprietário, mantém a base aceita da transcrição, reproduz o trecho final de
eventos em tempo real ainda não confirmado e se reconecta a um turno de
inferência em andamento com a mesma identidade. A mensagem final da inferência
é autoritativa caso deltas transmitidos não tenham sido recebidos. Uma época do
proprietário substituta bloqueia o processo e causa uma saída limpa.

Uma rejeição de transcrição `stale-base-leaf` interrompe de forma definitiva a
execução atual. O modo worker não tenta novamente a sequência rejeitada em uma
folha diferente, portanto nenhuma confirmação duplicada é produzida; qualquer
trecho final ainda não confirmado e mantido na memória dessa execução é perdido.
A reinicialização pertence ao proprietário do posicionamento do marco 3, que
deve criar uma nova atribuição a partir da transcrição autoritativa e do registro
de confirmações do Gateway. Da mesma forma, uma reinicialização do processo do
Gateway encerra um turno de inferência pendente com um erro do provedor; somente
uma reconexão do túnel ou do WebSocket do worker pode se reconectar a um fluxo de
inferência ativo no mesmo processo.

Consulte [Protocolo do Gateway](/pt-BR/gateway/protocol#worker-role-and-closed-protocol)
para conhecer a superfície RPC fechada do worker e o [Plano de workers em
nuvem](/pt-BR/plan/cloud-workers) para conhecer a arquitetura e o modelo de segurança.
