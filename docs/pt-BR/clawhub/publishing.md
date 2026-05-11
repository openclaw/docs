---
read_when:
    - Publicando uma Skill ou um Plugin
    - Depuração de erros de escopo de proprietário ou pacote
    - Adicionando comportamento de publicação na interface, na CLI ou no backend
summary: Como a publicação no ClawHub funciona para Skills, plugins, proprietários, escopos, lançamentos e revisão.
x-i18n:
    generated_at: "2026-05-11T20:24:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publicação

A publicação no ClawHub tem escopo por proprietário: cada publicação aponta para um publicador, e o servidor decide se o usuário autenticado tem permissão para publicar ali.

## Proprietários

Um proprietário é um identificador de publicador do ClawHub, como `@alice` ou `@openclaw`.
Proprietários pessoais são criados para usuários. Proprietários de organizações podem ter vários membros.

Ao publicar, você usa seu proprietário pessoal ou escolhe um proprietário de organização em que tenha acesso de publicador.

## Skills

Skills são publicadas a partir de uma pasta de skill. A página pública é:

```text
https://clawhub.ai/<owner>/<slug>
```

Exemplo:

```text
https://clawhub.ai/alice/review-helper
```

A solicitação de publicação inclui o proprietário selecionado, slug, versão, changelog e arquivos. O servidor verifica se o ator pode publicar como esse proprietário antes de criar a versão.

Para mover uma skill existente para outro proprietário enquanto publica uma nova versão, escolha o novo proprietário e confirme explicitamente a transferência de propriedade. Na CLI/API, passe o proprietário de destino junto com a adesão à migração:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

A migração de proprietário de skill exige acesso de administrador ou proprietário tanto no proprietário atual quanto no proprietário de destino. Ela preserva a skill, o histórico de versões, estatísticas, comentários, forks, aliases e trilha de auditoria; URLs do proprietário antigo continuam funcionando pelo caminho de alias/redirecionamento.

## Plugins

Plugins usam nomes de pacote no estilo npm. Nomes de pacote com escopo incluem o proprietário na primeira parte do nome:

```text
@owner/package-name
```

O escopo deve corresponder ao proprietário de publicação selecionado. Se o seu pacote se chama `@openclaw/dronzer`, ele só pode ser publicado como `@openclaw`. Se você publicar como `@vintageayu`, renomeie o pacote para `@vintageayu/dronzer`.

Isso impede que um pacote reivindique um namespace de organização que o publicador não controla.

## Fluxo de lançamento

1. A interface, a CLI ou o fluxo de trabalho do GitHub reúne metadados e arquivos do pacote.
2. A solicitação de publicação é enviada ao ClawHub com o proprietário selecionado.
3. O servidor valida permissões do proprietário, escopo do pacote, nome do pacote, versão, limites de arquivos e metadados de origem.
4. O ClawHub armazena o lançamento e inicia verificações de segurança automatizadas.
5. Novos lançamentos ficam ocultos das superfícies normais de instalação/download até que a revisão e a verificação sejam concluídas.

Se a validação falhar, o lançamento não será criado.

## Perguntas frequentes

### O escopo do pacote deve corresponder ao proprietário selecionado

Se o escopo do pacote e o proprietário selecionado não corresponderem, o ClawHub rejeitará a publicação:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Para corrigir, escolha o proprietário nomeado pelo escopo do pacote ou renomeie o pacote para que o escopo corresponda ao proprietário como o qual você pode publicar.

Se o nome do pacote já tiver o escopo correto, mas o pacote pertencer ao publicador errado, transfira a propriedade em vez disso:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Use transferência de pacote ou skill somente quando você tiver acesso de administrador tanto ao proprietário atual quanto ao publicador de destino. A transferência de pacote não permite que você publique em um escopo que não pode gerenciar.

Isso protege namespaces de organizações. Um pacote chamado `@openclaw/dronzer` reivindica o namespace `@openclaw`, então somente publicadores com acesso ao proprietário `@openclaw` podem publicá-lo.
