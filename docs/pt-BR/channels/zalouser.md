---
read_when:
    - Configurando o Zalo Pessoal para o OpenClaw
    - Depurando o login ou o fluxo de mensagens do Zalo Pessoal
summary: Suporte a conta pessoal do Zalo via `zca-js` nativo (login por QR), recursos e configuração
title: Zalo Pessoal
x-i18n:
    generated_at: "2026-04-08T02:14:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08f50edb2f4c6fe24972efe5e321f5fd0572c7d29af5c1db808151c7c943dc66
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo Pessoal (não oficial)

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** via `zca-js` nativo dentro do OpenClaw.

> **Aviso:** Esta é uma integração não oficial e pode resultar em suspensão/banimento da conta. Use por sua conta e risco.

## Plugin incluído

O Zalo Pessoal é distribuído como um plugin incluído nas versões atuais do OpenClaw, portanto compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Zalo Pessoal, instale manualmente:

- Instale via CLI: `openclaw plugins install @openclaw/zalouser`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

Nenhum binário externo da CLI `zca`/`openzca` é necessário.

## Configuração rápida (iniciante)

1. Verifique se o plugin Zalo Pessoal está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Faça login (QR, na máquina do Gateway):
   - `openclaw channels login --channel zalouser`
   - Escaneie o código QR com o app móvel do Zalo.
3. Ative o canal:

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
5. O acesso por DM usa pairing por padrão; aprove o código de pairing no primeiro contato.

## O que é

- Executa inteiramente no processo via `zca-js`.
- Usa listeners de eventos nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de “conta pessoal” em que a API de Bot do Zalo não está disponível.

## Nomenclatura

O id do canal é `zalouser` para deixar explícito que isso automatiza uma **conta de usuário pessoal do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Encontrando IDs (diretório)

Use a CLI de diretório para descobrir contatos/grupos e seus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em blocos de ~2000 caracteres (limites do cliente Zalo).
- O streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` oferece suporte a: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` aceita IDs ou nomes de usuários. Durante a configuração, nomes são resolvidos para IDs usando a busca de contatos em processo do plugin.

Aprove com:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não estiver definido.
- Restrinja a uma allowlist com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs de grupo estáveis; os nomes são resolvidos para IDs na inicialização quando possível)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes em grupos permitidos podem acionar o bot)
- Bloqueie todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar allowlists de grupo.
- Na inicialização, o OpenClaw resolve nomes de grupos/usuários em allowlists para IDs e registra o mapeamento.
- A correspondência da allowlist de grupos usa apenas ID por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja ativado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade de emergência que reativa a correspondência por nome de grupo mutável.
- Se `groupAllowFrom` não estiver definido, o runtime usa `allowFrom` como fallback para verificações de remetentes em grupo.
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

### Bloqueio por menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: id/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos em allowlist quanto ao modo de grupo aberto.
- Citar uma mensagem do bot conta como uma menção implícita para ativação no grupo.
- Comandos de controle autorizados (por exemplo, `/new`) podem ignorar o bloqueio por menção.
- Quando uma mensagem de grupo é ignorada porque a menção é obrigatória, o OpenClaw a armazena como histórico pendente do grupo e a inclui na próxima mensagem de grupo processada.
- O limite do histórico de grupo usa por padrão `messages.groupChat.historyLimit` (fallback `50`). Você pode substituir por conta com `channels.zalouser.historyLimit`.

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
- A ação de reação de mensagem `react` é compatível com `zalouser` nas ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reação: [Reações](/pt-BR/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenClaw envia confirmações de entregue + visualizado (melhor esforço).

## Solução de problemas

**O login não persiste:**

- `openclaw channels status --probe`
- Faça login novamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**O nome na allowlist/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom`/`groups`, ou nomes exatos de amigo/grupo.

**Atualizou a partir da configuração antiga baseada em CLI:**

- Remova quaisquer suposições antigas sobre processo externo `zca`.
- O canal agora roda totalmente no OpenClaw sem binários externos de CLI.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
