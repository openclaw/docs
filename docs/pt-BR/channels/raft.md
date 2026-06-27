---
read_when:
    - Você quer conectar o OpenClaw a um workspace do Raft
    - Você está configurando um Agente Externo Raft
    - Você está depurando a entrega de ativação do Raft
sidebarTitle: Raft
summary: Suporte a Agente Externo do Raft por meio da ponte de ativação da CLI do Raft
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:12:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

O suporte ao Raft conecta um agente OpenClaw a um Agente Externo do Raft por meio da
CLI local do Raft. O Raft envia dicas de ativação autenticadas para o Gateway. Em seguida, o agente usa
a CLI do Raft para verificar e enviar mensagens.

## Instalação

O Raft é um Plugin externo oficial. Instale-o no host do Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Pré-requisitos

- Um workspace do Raft com um Agente Externo.
- A CLI do Raft instalada no mesmo host que o Gateway do OpenClaw.
- Um perfil da CLI do Raft que já esteja conectado e associado a esse Agente Externo.

O Plugin não armazena credenciais do Raft. A CLI do Raft mantém essa autenticação
em seu próprio perfil.

## Configurar

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

Para a conta padrão, você também pode definir `RAFT_PROFILE` no ambiente do
Gateway:

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

O fluxo de configuração interativo registra o mesmo perfil:

```bash
openclaw channels setup raft
```

## Como Funciona

Quando o Gateway inicia, o Plugin:

1. Abre um endpoint HTTP de ativação apenas por loopback em uma porta efêmera.
2. Inicia `raft --profile <profile> agent bridge` com esse endpoint e um
   token por processo.
3. Aceita apenas dicas de ativação autenticadas e sem conteúdo, com uma identidade de repetição da ponte local.
4. Exige um entre `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` ou `id`.
5. Desduplica entregas de ativação repetidas recentemente pelo id de evento da ponte, inclusive entre reinicializações do Gateway.
6. Retorna uma sessão de runtime estável para a ponte atual e um lote vazio de drenagem de atividades para o protocolo da CLI do Raft.
7. Inicia um turno serializado do agente OpenClaw para cada ativação aceita.

A ponte é responsável pelas novas tentativas de entrega e reconexões do Raft. O turno do OpenClaw recebe
apenas um aviso de ativação, não uma cópia do corpo da mensagem do Raft. Ele usa a CLI para ler
mensagens pendentes e enviar sua resposta:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
O Raft não é um transporte normal de mensagens push. O OpenClaw não envia automaticamente
o texto final do modelo de volta pela ponte, portanto o agente deve usar a
CLI do Raft depois de processar uma ativação.
</Note>

## Verificar

Verifique se o OpenClaw consegue encontrar a CLI e tem um perfil configurado:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Em seguida, envie uma mensagem ao Agente Externo do Raft. O log do Gateway deve mostrar a
ponte do Raft sendo iniciada, seguida por uma ativação de entrada. O agente deve usar o
perfil do Raft configurado para verificar suas mensagens pendentes.

## Solução de Problemas

<AccordionGroup>
  <Accordion title="A CLI do Raft está ausente">
    Instale a CLI do Raft no host do Gateway e torne `raft` disponível no
    `PATH` do serviço. Verifique com `raft --help` e reinicie o Gateway.
  </Accordion>
  <Accordion title="A ponte encerra imediatamente">
    Verifique se o perfil configurado está conectado e pertence ao
    Agente Externo do Raft pretendido. Execute `raft --profile <profile> agent bridge` diretamente
    para ver o diagnóstico da CLI.
  </Accordion>
  <Accordion title="Uma ativação chega, mas nenhuma resposta do Raft é enviada">
    Isso é esperado quando o agente não invoca a CLI do Raft. A ponte de ativação
    não transporta corpos de mensagens nem respostas finais automáticas. Verifique a
    política de ferramentas do agente e garanta que ele possa executar `raft --profile <profile> message
    check` e `message send`.
  </Accordion>
</AccordionGroup>

## Referências

- [Raft](https://raft.build/)
- [Documentação do Raft](https://docs.raft.build/welcome/)
- [Integração do Hermes com o Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
