---
read_when:
    - Você quer conectar o OpenClaw a um workspace do Raft
    - Você está configurando um Agente Externo do Raft
    - Você está depurando a entrega de ativação do Raft
sidebarTitle: Raft
summary: Suporte a agentes externos do Raft por meio da ponte de ativação da CLI do Raft
title: Raft
x-i18n:
    generated_at: "2026-07-12T14:55:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft conecta um agente do OpenClaw a um Agente Externo do Raft por meio da CLI
local do Raft. O Raft envia avisos de ativação autenticados ao Gateway; em seguida,
o agente usa a CLI do Raft para verificar e enviar mensagens. Somente conversas
diretas (sem grupos).

## Instalação

O Raft é um plugin externo oficial. Instale-o no host do Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Pré-requisitos

- Um espaço de trabalho do Raft com um Agente Externo.
- A CLI do Raft instalada no mesmo host que o Gateway do OpenClaw, no `PATH`
  do serviço.
- Um perfil da CLI do Raft que já esteja autenticado e associado a esse
  Agente Externo.

O plugin não armazena credenciais do Raft; a CLI do Raft mantém essa
autenticação em seu próprio perfil.

## Configuração

Defina o perfil na configuração:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Para a conta padrão, você pode definir `RAFT_PROFILE` no ambiente do Gateway:

```bash
RAFT_PROFILE=openclaw
```

Use uma conta nomeada quando um Gateway se conectar a mais de um Agente Externo do Raft:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

A configuração interativa registra o mesmo perfil:

```bash
openclaw channels add --channel raft
```

## Como funciona

Quando o Gateway é iniciado, o plugin:

1. Abre um endpoint HTTP de ativação, acessível somente por loopback, em uma porta efêmera.
2. Inicia `raft --profile <profile> agent bridge` com esse endpoint e um
   token por processo.
3. Aceita somente avisos de ativação autenticados, sem conteúdo e com uma identidade
   de repetição, provenientes da ponte local.
4. Exige um dos campos `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id` ou `id` em cada carga útil de ativação.
5. Elimina duplicatas de entregas de ativação repetidas pelo ID de evento da ponte durante 24 horas,
   inclusive entre reinicializações do Gateway.
6. Retorna uma sessão de runtime estável para a ponte atual e um lote vazio
   de drenagem de atividades para o protocolo da CLI do Raft.
7. Inicia um turno serializado do agente do OpenClaw para cada ativação aceita.

A ponte gerencia as novas tentativas de entrega e as reconexões do Raft. O turno do
OpenClaw recebe somente um aviso de ativação, não uma cópia do corpo da mensagem
do Raft. Ele usa a CLI para ler mensagens pendentes e enviar sua resposta:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
O Raft não é um transporte de mensagens por push. O OpenClaw não envia automaticamente o texto final do modelo pela ponte; portanto, o agente deve usar a CLI do Raft após processar uma ativação.
</Note>

## Verificação

Verifique se o OpenClaw consegue encontrar a CLI e se há um perfil configurado:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Em seguida, envie uma mensagem ao Agente Externo do Raft. O log do Gateway deve mostrar
a inicialização da ponte do Raft, seguida por uma ativação recebida. O agente deve usar
o perfil configurado do Raft para verificar suas mensagens pendentes.

## Solução de problemas

<AccordionGroup>
  <Accordion title="A CLI do Raft está ausente">
    Instale a CLI do Raft no host do Gateway e disponibilize `raft` no
    `PATH` do serviço. Verifique-a com `raft --help` e reinicie o Gateway.
  </Accordion>
  <Accordion title="A ponte é encerrada imediatamente">
    Verifique se o perfil configurado está autenticado e pertence ao
    Agente Externo do Raft pretendido. Execute `raft --profile <profile> agent bridge` diretamente
    para ver o diagnóstico da CLI.
  </Accordion>
  <Accordion title="Uma ativação chega, mas nenhuma resposta do Raft é enviada">
    Isso é esperado quando o agente não invoca a CLI do Raft. A ponte de
    ativação não transporta corpos de mensagens nem respostas finais automáticas. Verifique a
    política de ferramentas do agente e garanta que ele possa executar `raft --profile <profile>
    message check` e `message send`.
  </Accordion>
</AccordionGroup>

## Referências

- [Raft](https://raft.build/)
- [Documentação do Raft](https://docs.raft.build/welcome/)
- [Integração do Hermes com o Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
