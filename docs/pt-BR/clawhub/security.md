---
read_when:
    - Entendendo os resultados de verificação e moderação do ClawHub
    - Relatar uma Skill ou um pacote
    - Recuperação de uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, verificação, denúncia, recurso e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:26:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

ClawHub é aberto à publicação, mas as listagens públicas ainda passam por controles
de confiança, varredura, denúncia e moderação. O objetivo é prático: ajudar os usuários
a inspecionar o que instalam, dar aos publicadores um caminho de recuperação para falsos positivos
e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma habilidade ou plugin, verifique sua listagem no ClawHub para:

- atribuição de proprietário e fonte
- versão mais recente e changelog
- variáveis de ambiente ou permissões necessárias
- metadados de compatibilidade para plugins
- status de varredura ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale apenas conteúdo que você entende e em que confia.

## Estados de varredura

ClawHub pode exibir resultados de varredura ou moderação em páginas públicas e diagnósticos
visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueante foi encontrado.
- `suspicious`: a versão exige cautela ou revisão.
- `malicious`: a versão é considerada insegura.
- `pending`: as verificações ainda não terminaram.
- `held`, `quarantined`, `revoked` ou `hidden`: a versão não está totalmente
  disponível nas superfícies públicas de instalação.

A redação exata pode variar conforme a superfície, mas o significado prático é o mesmo: se uma
versão está retida ou bloqueada, os usuários não devem instalá-la até que o proprietário resolva
o problema ou a moderação a restaure.

## Skills

As varreduras de habilidades analisam o pacote de habilidade publicado, os metadados, os requisitos
declarados e instruções suspeitas.

ClawHub presta atenção especial a inconsistências entre o que uma habilidade declara e
o que ela parece fazer. Por exemplo, uma habilidade que referencia uma chave de API obrigatória
deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes
de instalar.

As descobertas de varredura são baseadas em artefatos. Comportamento esperado do provedor, como credenciais
de API declaradas, callbacks OAuth em localhost, limpeza de desinstalação com escopo, codificação Basic Auth
ou uploads de arquivos selecionados pelo usuário para o provedor declarado, é tratado
de forma diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos privados,
destinos de rede não relacionados ou abuso furtivo de navegador.

Veja [Formato de habilidade](/pt-BR/clawhub/skill-format).

## Plugins

Versões de plugins incluem metadados de pacote, atribuição de fonte, campos de compatibilidade
e informações de integridade de artefatos.

OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de pacote
também podem expor metadados de digest para que OpenClaw possa verificar artefatos
baixados. ClawScan inclui metadados declarados de env/config `openclaw.environment` do pacote
ao revisar versões de plugins, para que os requisitos declarados de runtime sejam
comparados ao comportamento observado.

## Denúncias

Usuários autenticados podem denunciar habilidades, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. Abuso do sistema de denúncias também pode levar a
ação na conta.

Exemplos de denúncia:

- metadados enganosos
- requisitos de credenciais ou permissões não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou personificação
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Denúncias de má-fé ou marca registrada

ClawHub usa o mesmo fluxo de denúncias e moderação da equipe para registros de má-fé,
personificação e disputas relacionadas a marcas registradas. Essas denúncias precisam
de contexto suficiente para a equipe identificar o reclamante, a listagem contestada e
a ação solicitada.

Inclua:

- a URL canônica da habilidade ou pacote no ClawHub e o identificador do proprietário
- a marca registrada, projeto, empresa ou nome do produto em questão
- evidência pública da propriedade ou autoridade do reclamante
- por que o proprietário atual não está autorizado a publicar sob esse nome
- a ação solicitada, como ocultar enquanto aguarda revisão, transferir propriedade, renomear
  ou remover

Não coloque segredos privados ou documentos legais sensíveis em denúncias públicas. Abra
uma issue no GitHub com evidências não sensíveis e peça aos mantenedores um caminho de
encaminhamento privado quando necessário.

## Contestações e novas varreduras

Proprietários podem solicitar uma nova varredura quando acreditarem que uma habilidade ou pacote foi incorretamente
retido ou sinalizado. Moderadores e administradores da plataforma podem solicitar novas varreduras para qualquer
habilidade ou pacote ao lidar com denúncias ou solicitações de suporte:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Para conteúdo moderado, proprietários podem conseguir enviar uma contestação pelas
superfícies do ClawHub visíveis ao proprietário. As contestações devem explicar o que mudou ou por que a
sinalização está incorreta.

## Retenções de moderação

Quando o scanner estático sinaliza uma habilidade enviada como maliciosa, o publicador é
automaticamente colocado sob retenção de moderação (`requiresModerationAt` definido no
usuário). Isso oculta todas as habilidades do publicador, faz futuras publicações
começarem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Descobertas estáticas suspeitas são retidas como evidência de arquivo/linha para moderadores,
mas não ocultam conteúdo nem decidem o veredito público da varredura por conta própria.
Novos envios permanecem em estado de revisão/pendente até que as revisões do VirusTotal e LLM
sejam concluídas; a varredura estática só bloqueia imediatamente para assinaturas maliciosas.
As revisões LLM do ClawScan mantêm notas alinhadas ao propósito como orientação; elas só retornam um
veredito Review/suspicious quando a revisão estruturada inclui uma preocupação material.

Administradores podem remover uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura
habilidades ocultas pela retenção no nível do usuário e grava uma entrada de log de auditoria
`user.moderation.lift`. Habilidades ocultas por outros motivos, ou cuja própria varredura estática permanece
maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves
podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou listagens
removidas.

Contas excluídas, banidas ou desativadas não podem usar tokens da API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação na conta, entre na interface web para revisar o
estado da conta ou entre em contato com os mantenedores pelo canal de suporte esperado do projeto.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões necessárias
- evite comandos de instalação ofuscados
- vincule à fonte quando possível
- use dry runs antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
