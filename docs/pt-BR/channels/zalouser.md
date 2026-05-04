---
read_when:
    - Configurando o Zalo Personal para o OpenClaw
    - Depuração do login ou do fluxo de mensagens do Zalo Personal
summary: Suporte a contas pessoais do Zalo via zca-js nativo (login por QR), capacidades e configuração
title: Zalo pessoal
x-i18n:
    generated_at: "2026-05-04T18:23:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** via `zca-js` nativo dentro do OpenClaw.

<Warning>
Esta é uma integração não oficial e pode resultar em suspensão ou banimento da conta. Use por sua própria conta e risco.
</Warning>

## Plugin incluído

O Zalo Personal é fornecido como um Plugin incluído nas versões atuais do OpenClaw, portanto builds
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui o Zalo Personal,
instale o pacote npm diretamente:

- Instale via CLI: `openclaw plugins install @openclaw/zalouser`
- Versão fixada: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

Nenhum binário de CLI externo `zca`/`openzca` é necessário.

## Configuração rápida (iniciante)

1. Verifique se o Plugin Zalo Personal está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Faça login (QR, na máquina do Gateway):
   - `openclaw channels login --channel zalouser`
   - Escaneie o código QR com o aplicativo móvel do Zalo.
3. Habilite o canal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Reinicie o Gateway (ou conclua a configuração).
5. O acesso por DM usa pareamento por padrão; aprove o código de pareamento no primeiro contato.

## O que é

- Executa totalmente em processo via `zca-js`.
- Usa listeners de eventos nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de “conta pessoal” em que a API de Bot do Zalo não está disponível.

## Nomenclatura

O id do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Como encontrar IDs (diretório)

Use a CLI de diretório para descobrir pares/grupos e seus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em partes de ~2000 caracteres (limites do cliente Zalo).
- Streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` aceita: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` deve usar IDs estáveis de usuários do Zalo. Durante a configuração interativa, nomes inseridos podem ser resolvidos para IDs usando a consulta de contatos em processo do Plugin.

Se um nome bruto permanecer na configuração, a inicialização o resolverá somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` estiver habilitado. Sem essa adesão explícita, as verificações de remetente em tempo de execução usam apenas ID e nomes brutos são ignorados para autorização.

Aprove via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- Restrinja a uma lista de permissões com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs estáveis de grupos; nomes são resolvidos para IDs na inicialização somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes em grupos permitidos podem acionar o bot)
- Bloqueie todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar listas de permissões de grupos.
- Na inicialização, o OpenClaw resolve nomes de grupos/usuários em listas de permissões para IDs e registra o mapeamento somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
- A correspondência de lista de permissões de grupos usa apenas ID por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade de emergência que reabilita a resolução mutável de nomes na inicialização e a correspondência de nomes de grupos em tempo de execução.
- Se `groupAllowFrom` não estiver definido, o tempo de execução recorre a `allowFrom` para verificações de remetente de grupo.
- As verificações de remetente se aplicam tanto a mensagens normais de grupo quanto a comandos de controle (por exemplo, `/new`, `/reset`).

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Controle por menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: id/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos na lista de permissões quanto ao modo de grupo aberto.
- Citar uma mensagem do bot conta como uma menção implícita para ativação em grupo.
- Comandos de controle autorizados (por exemplo, `/new`) podem contornar o controle por menção.
- Quando uma mensagem de grupo é ignorada porque uma menção é exigida, o OpenClaw a armazena como histórico de grupo pendente e a inclui na próxima mensagem de grupo processada.
- O limite de histórico de grupo usa `messages.groupChat.historyLimit` por padrão (fallback `50`). Você pode substituí-lo por conta com `channels.zalouser.historyLimit`.

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Múltiplas contas

As contas são mapeadas para perfis `zalouser` no estado do OpenClaw. Exemplo:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Digitação, reações e confirmações de entrega

- O OpenClaw envia um evento de digitação antes de despachar uma resposta (melhor esforço).
- A ação de reação a mensagem `react` é compatível com `zalouser` em ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reações: [Reações](/pt-BR/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenClaw envia confirmações de entregue + visto (melhor esforço).

## Solução de problemas

**O login não persiste:**

- `openclaw channels status --probe`
- Faça login novamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**O nome na lista de permissões/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom` e IDs estáveis de grupos em `groups`. Se você precisar intencionalmente de nomes exatos de amigos/grupos, habilite `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Atualizou de uma configuração antiga baseada em CLI:**

- Remova quaisquer pressupostos antigos sobre processo `zca` externo.
- O canal agora executa totalmente no OpenClaw sem binários de CLI externos.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço
