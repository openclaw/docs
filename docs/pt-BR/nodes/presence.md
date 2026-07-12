---
read_when:
    - Você quer que o OpenClaw identifique o Mac ativo
    - Você está depurando a atividade da última entrada ou a seleção do Node ativo
    - Você quer entender o roteamento das notificações de conexão do Node
summary: Detecte o Mac que você usou mais recentemente e encaminhe os alertas do Node para ele
title: Presença ativa no computador
x-i18n:
    generated_at: "2026-07-12T15:24:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

A presença ativa no computador informa ao Gateway qual Node macOS conectado recebeu
a entrada física mais recente do mouse ou teclado. O OpenClaw usa esse sinal para
marcar um Mac como `active`, fornecer ao agente uma indicação estável do Node ativo e encaminhar
alertas de conexão de Nodes ao computador em que você provavelmente está presente.

Isso é diferente da [presença do sistema](/pt-BR/concepts/presence), que é a lista em tempo real
de clientes do Gateway, e dos beacons duráveis `node.presence.alive`, que
registram quando um Node móvel foi ativado pela última vez sem tratá-lo como conectado.

## Requisitos

- O aplicativo OpenClaw para macOS está emparelhado e conectado no modo Node.
- A permissão **Accessibility** foi concedida ao aplicativo OpenClaw assinado.
- Para alertas de conexão, a permissão **Notifications** também foi concedida e o
  Node Mac disponibiliza `system.notify`.

No momento, o relatório de atividade é implementado pelo Node nativo do macOS. Hosts de
Nodes iOS, Android, watchOS e sem interface gráfica podem informar o estado de conexão ou
de última atividade em segundo plano, mas não disputam a designação de computador ativo.

## Verificar o computador ativo

1. No aplicativo para macOS, abra **Settings -> Permissions** e conceda
   **Accessibility** nos Ajustes do Sistema do macOS.
2. Confirme se o Node Mac está conectado:

   ```bash
   openclaw nodes status --connected
   ```

3. Mova o mouse ou pressione uma tecla nesse Mac e execute:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

O Mac elegível com atividade mais recente é marcado como `active`. A saída de status mostra há
quanto tempo ocorreu sua última entrada; `describe` disponibiliza `active`, `lastActiveAtMs` e
`presenceUpdatedAtMs`. A atividade é intencionalmente consolidada, portanto a exibição pode levar
até cerca de 15 segundos para refletir outra entrada após um relatório recente.

## Como a atividade se torna presença

O relator do macOS consulta o relógio de inatividade do sistema HID a cada dois segundos. Ele
envia um relatório quando a conexão de um Node fica pronta e depois informa novas atividades físicas
no máximo uma vez a cada 15 segundos. Durante a inatividade, ele envia um sinal de manutenção
a cada três minutos. A duração da inatividade é limitada a 30 dias para que uma amostra muito antiga
não avance com o tempo e seja incorretamente considerada a do computador mais recente.

O Gateway aceita a atividade somente quando todas estas condições são verdadeiras:

- o evento pertence à conexão autenticada atual desse ID de Node;
- o Node tem a permissão efetiva `accessibility: true`;
- o conteúdo contém um valor inteiro limitado de `idleSeconds`.

O Gateway subtrai `idleSeconds` do seu próprio horário de observação para derivar
`lastActiveAtMs`. Ele nunca confia em um registro de data e hora do relógio fornecido pelo Node. Entre
os Macs elegíveis conectados, vence o `lastActiveAtMs` mais recente; em caso de empate, é usada a
atualização de presença mais recente.

A presença é local ao processo e vinculada à conexão. Desconectar a sessão atual,
substituí-la por outra sessão usando o mesmo ID de Node ou revogar
Accessibility limpa o estado de atividade desse Node e recalcula o Mac ativo.

## Privacidade e contexto do modelo

O OpenClaw envia a duração da inatividade, não o conteúdo das entradas. Ele não envia valores de teclas,
coordenadas do mouse, nomes de aplicativos, títulos de janelas nem eventos brutos de entrada. O
relator do macOS lê o estado HID do hardware, portanto eventos sintéticos de controle do computador
não fazem um Mac automatizado parecer ser o computador usado fisicamente por você.

A atividade contínua não cria eventos de sistema visíveis ao modelo. A linha dinâmica
do runtime contém somente o ID de Node autenticado:

```text
active_node=<node-id>
```

Registros de data e hora exatos e nomes de exibição controlados pelos Nodes ficam fora do prompt para
evitar injeção de prompt e alterações frequentes no cache. Quando o agente precisa de detalhes atuais,
a ferramenta `nodes` pode consultar `node.list` ou `node.describe`.

## Como os alertas de conexão são encaminhados

Depois que um Node conclui o handshake com o Gateway, o OpenClaw aguarda 750 milissegundos para
que o Mac em conexão possa enviar sua primeira amostra de atividade. Em seguida, tenta usar o
Mac conectado com suporte a notificações que tenha a atividade mais recente.

- Se a entrega primária for bem-sucedida, nenhum outro Mac receberá o alerta.
- Se nenhum Mac ativo estiver disponível ou a entrega primária falhar, o OpenClaw aguarda cinco
  segundos e tenta todos os outros Macs conectados que disponibilizam `system.notify`.
- Um alerta de reconexão para o mesmo Node é suprimido por cinco minutos após uma
  tentativa efetiva de entrega, impedindo que oscilações de reconexão produzam uma
  enxurrada de notificações.

Os alertas são vinculados a conexões exatas dos Nodes. Uma sessão de origem desconectada ou substituída
não pode concluir um alerta antigo agendado, e uma conexão de destino substituta
ainda pode participar da entrega de fallback.

## Solução de problemas

| Sintoma                                   | Verificação                                                                                                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nenhuma linha está marcada como `active`  | Confirme se um Node macOS nativo está conectado e se `openclaw nodes describe --node <id>` mostra `permissions.accessibility: true`.                                         |
| O Mac errado permanece ativo              | Use esse Mac fisicamente, aguarde a janela de consolidação e execute novamente `openclaw nodes status`. Ações sintéticas de controle do computador não são consideradas.     |
| Os dados da última entrada desaparecem    | Verifique se o Mac foi desconectado, se a sessão do Node foi substituída ou se Accessibility foi revogada. Cada condição limpa intencionalmente a atividade.                 |
| O alerta aparece em vários Macs           | A entrega primária estava indisponível ou falhou, então o fallback adiado foi executado. Verifique se o Mac ativo está conectado, permite notificações e disponibiliza `system.notify`. |
| O agente não menciona o Mac ativo         | Inicie um novo turno após alterações na atividade. A indicação do runtime é estável e compacta; use a ferramenta `nodes` para obter os metadados atuais exatos.              |

Para recuperar o TCC, consulte [permissões do macOS](/pt-BR/platforms/mac/permissions). Para falhas de
conexão e comandos de Nodes, consulte [Solução de problemas de Nodes](/pt-BR/nodes/troubleshooting).

## Relacionados

- [Nodes](/pt-BR/nodes)
- [CLI de Nodes](/pt-BR/cli/nodes)
- [Presença do sistema](/pt-BR/concepts/presence)
- [Protocolo do Gateway](/pt-BR/gateway/protocol#presence)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
