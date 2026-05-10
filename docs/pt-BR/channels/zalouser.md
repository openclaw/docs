---
read_when:
    - Configurando o Zalo Personal para OpenClaw
    - Depuração do fluxo de login ou de mensagens do Zalo Personal
summary: Suporte a contas pessoais do Zalo via zca-js nativo (login por QR), capacidades e configuração
title: Zalo pessoal
x-i18n:
    generated_at: "2026-05-10T19:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** via `zca-js` nativo dentro do OpenClaw.

<Warning>
Esta é uma integração não oficial e pode resultar em suspensão ou banimento da conta. Use por sua conta e risco.
</Warning>

## Plugin incluído

O Zalo Personal é distribuído como um plugin incluído nas versões atuais do OpenClaw, portanto builds
empacotados normais não precisam de uma instalação separada.

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui o Zalo Personal,
instale o pacote npm diretamente:

- Instale via CLI: `openclaw plugins install @openclaw/zalouser`
- Versão fixada: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

Nenhum binário CLI externo `zca`/`openzca` é necessário.

## Configuração rápida (iniciante)

1. Garanta que o plugin Zalo Personal esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Faça login (QR, na máquina do Gateway):
   - `openclaw channels login --channel zalouser`
   - Escaneie o código QR com o app móvel do Zalo.
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
5. O acesso por DM usa emparelhamento por padrão; aprove o código de emparelhamento no primeiro contato.

## O que é

- Executa inteiramente no processo via `zca-js`.
- Usa listeners de eventos nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de "conta pessoal" em que a API de Bot do Zalo não está disponível.

## Nomeação

O id do canal é `zalouser` para deixar explícito que isto automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Encontrando IDs (diretório)

Use a CLI de diretório para descobrir pares/grupos e seus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em blocos de ~2000 caracteres (limites do cliente Zalo).
- Streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` oferece suporte a: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` deve usar IDs estáveis de usuário do Zalo. Ele também pode referenciar grupos estáticos de acesso de remetentes (`accessGroup:<name>`). Durante a configuração interativa, os nomes inseridos podem ser resolvidos para IDs usando a busca de contatos em processo do plugin.

Se um nome bruto permanecer na configuração, a inicialização só o resolverá quando `channels.zalouser.dangerouslyAllowNameMatching: true` estiver habilitado. Sem essa adesão explícita, as verificações de remetente em tempo de execução usam apenas IDs, e nomes brutos são ignorados para autorização.

Aprove via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- Restrinja a uma lista de permissões com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs estáveis de grupo; nomes são resolvidos para IDs na inicialização somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes nos grupos permitidos podem acionar o bot; grupos estáticos de acesso de remetentes podem ser referenciados com `accessGroup:<name>`)
- Bloqueie todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar listas de permissões de grupos.
- Na inicialização, o OpenClaw resolve nomes de grupos/usuários em listas de permissões para IDs e registra o mapeamento somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
- A correspondência da lista de permissões de grupos usa apenas IDs por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade de emergência que reabilita a resolução mutável de nomes na inicialização e a correspondência de nomes de grupos em tempo de execução.
- Se `groupAllowFrom` não estiver definido, o tempo de execução usa `allowFrom` como fallback para verificações de remetentes de grupo.
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

### Controle de menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: id/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos em lista de permissões quanto ao modo de grupo aberto.
- Citar uma mensagem do bot conta como uma menção implícita para ativação em grupo.
- Comandos de controle autorizados (por exemplo, `/new`) podem contornar o controle de menção.
- Quando uma mensagem de grupo é ignorada porque uma menção é exigida, o OpenClaw a armazena como histórico pendente do grupo e a inclui na próxima mensagem de grupo processada.
- O limite de histórico de grupo usa como padrão `messages.groupChat.historyLimit` (fallback `50`). Você pode substituir por conta com `channels.zalouser.historyLimit`.

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

## Várias contas

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
- A ação de reação de mensagem `react` é compatível com `zalouser` em ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reações: [Reações](/pt-BR/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenClaw envia confirmações de entregue + visto (melhor esforço).

## Solução de problemas

**O login não persiste:**

- `openclaw channels status --probe`
- Faça login novamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**O nome da lista de permissões/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom` e IDs estáveis de grupo em `groups`. Se você precisar intencionalmente de nomes exatos de amigos/grupos, habilite `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Atualizou a partir da antiga configuração baseada em CLI:**

- Remova quaisquer suposições antigas sobre processo externo `zca`.
- O canal agora executa totalmente no OpenClaw sem binários CLI externos.

## Relacionados

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
