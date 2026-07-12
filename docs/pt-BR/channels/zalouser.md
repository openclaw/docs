---
read_when:
    - Configurando o Zalo Personal para o OpenClaw
    - Depuração do login ou do fluxo de mensagens do Zalo Personal
summary: Suporte a contas pessoais do Zalo via zca-js nativo (login por QR), recursos e configuração
title: Zalo pessoal
x-i18n:
    generated_at: "2026-07-11T23:48:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** por meio do `zca-js` nativo, dentro do processo, sem nenhum binário de CLI externo.

<Warning>
Esta é uma integração não oficial e pode resultar na suspensão ou no banimento da conta. Use por sua conta e risco.
</Warning>

## Instalação

O Zalo Personal é um plugin externo oficial, não incluído no núcleo. Instale-o antes de usar:

```bash
openclaw plugins install @openclaw/zalouser
```

- Fixar uma versão: `openclaw plugins install @openclaw/zalouser@<version>`
- A partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Instale o plugin (acima).
2. Faça login (via QR, na máquina do Gateway):
   - `openclaw channels login --channel zalouser`
   - Escaneie o código QR com o aplicativo móvel do Zalo.
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
5. Por padrão, o acesso por mensagem direta usa pareamento; aprove o código de pareamento no primeiro contato.

## O que é

- É executado inteiramente dentro do processo por meio da biblioteca `zca-js` (sem nenhum binário externo `zca`/`openzca`).
- Usa listeners de eventos nativos (`message`, `error`) para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Foi projetado para casos de uso com "conta pessoal" nos quais a API de bots do Zalo não está disponível.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que esta integração automatiza uma **conta pessoal de usuário do Zalo** (não oficial). `zalo` está reservado para uma possível integração futura com a API oficial do Zalo.

## Como encontrar IDs (diretório)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em blocos de 2.000 caracteres (limite do cliente do Zalo).
- Não há suporte a streaming.

## Controle de acesso (mensagens diretas)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` deve usar IDs estáveis de usuários do Zalo. Também pode referenciar grupos estáticos de acesso de remetentes (`accessGroup:<name>`). Durante a configuração interativa, os nomes informados podem ser resolvidos para IDs usando a consulta de contatos executada dentro do processo pelo plugin.

Se um nome bruto permanecer na configuração, a inicialização só o resolverá quando `channels.zalouser.dangerouslyAllowNameMatching: true` estiver ativado. Sem essa aceitação explícita, as verificações de remetentes em tempo de execução usam somente IDs, e os nomes brutos são ignorados para fins de autorização.

Aprove por meio de:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "allowlist"` (os grupos exigem uma entrada explícita na lista de permissões).
- Abrir todos os grupos: `channels.zalouser.groupPolicy = "open"`.
- Bloquear todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- Com `groupPolicy = "allowlist"`:
  - As chaves de `channels.zalouser.groups` devem ser IDs estáveis de grupos; os nomes são resolvidos para IDs na inicialização somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` está ativado.
  - `channels.zalouser.groupAllowFrom` controla quais remetentes nos grupos permitidos podem acionar o bot; grupos estáticos de acesso de remetentes podem ser referenciados com `accessGroup:<name>`.
- O assistente de configuração pode solicitar listas de permissões de grupos.
- Por padrão, a correspondência com a lista de permissões de grupos usa somente IDs. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja ativado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade emergencial que reativa a resolução de nomes mutáveis na inicialização e a correspondência de nomes de grupos em tempo de execução.
- `groupAllowFrom` **não** recorre a `allowFrom` para mensagens normais de grupo: deixá-lo vazio em um grupo incluído na lista de permissões abre esse grupo para qualquer remetente. Comandos de controle autorizados (por exemplo, `/new`) são a exceção; as verificações do remetente do comando recorrem a `allowFrom` quando `groupAllowFrom` está vazio.

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` é um nome de campo legado; a configuração atual usa `enabled`. `openclaw doctor --fix` migra `allow` para `enabled` automaticamente.
</Note>

### Controle por menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se as respostas em grupo exigem uma menção.
- Ordem de resolução: ID do grupo -> alias `group:<id>` -> nome/slug do grupo (candidatos baseados em nome só se aplicam quando `dangerouslyAllowNameMatching: true`) -> `*` -> padrão (`true`).
- Aplica-se tanto aos grupos incluídos na lista de permissões quanto ao modo de grupos abertos.
- Citar uma mensagem do bot conta como uma menção implícita para ativar o grupo.
- Comandos de controle autorizados (por exemplo, `/new`) podem ignorar o controle por menção.
- Quando uma mensagem de grupo é ignorada porque uma menção é obrigatória, o OpenClaw a armazena como histórico pendente do grupo e a inclui na próxima mensagem de grupo processada.
- Limite do histórico de grupos: `channels.zalouser.historyLimit`, depois `messages.groupChat.historyLimit` e, por fim, o valor alternativo `50`.

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
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

## Variáveis de ambiente

A seleção do perfil também pode vir de variáveis de ambiente:

| Variável           | Finalidade                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Nome do perfil a ser usado quando nenhum `profile` estiver definido na configuração do canal ou da conta. |
| `ZCA_PROFILE`      | Alternativa legada, usada somente quando `ZALOUSER_PROFILE` não está definido.                      |

Os nomes dos perfis selecionam as credenciais de login salvas do Zalo no estado do OpenClaw. Ordem de resolução:

1. `profile` explícito na configuração.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. O ID da conta para contas que não são a padrão, ou `default` para a conta padrão.

Para configurações com várias contas, prefira definir `profile` em cada conta na configuração para que uma única variável de ambiente não faça várias contas compartilharem a mesma sessão de login.

## Digitação, reações e confirmações de entrega

- O OpenClaw envia um evento de digitação antes de despachar uma resposta (em caráter de melhor esforço).
- Há suporte à ação de reação a mensagens `react` para `zalouser` nas ações do canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica das reações: [Reações](/pt-BR/tools/reactions)
- Para mensagens de entrada que incluem metadados do evento, o OpenClaw envia confirmações de entrega e visualização (em caráter de melhor esforço).

## Solução de problemas

**O login não persiste:**

- `openclaw channels status --probe`
- Faça login novamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**O nome da lista de permissões/do grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom` e IDs estáveis de grupos em `groups`. Se você precisar intencionalmente de nomes exatos de amigos/grupos, ative `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Atualização a partir de uma configuração antiga baseada em `zca` externo/CLI:**

- Remova quaisquer pressupostos sobre um processo externo `zca`; agora o canal é executado inteiramente dentro do processo por meio do `zca-js`, sem nenhum binário de CLI externo.

## Conteúdo relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de conversas em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
