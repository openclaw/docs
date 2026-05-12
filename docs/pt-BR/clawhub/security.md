---
read_when:
    - Entendendo os resultados de varredura e moderação do ClawHub
    - Denunciar uma skill ou um pacote
    - Recuperando uma listagem retida, oculta ou bloqueada
summary: Comportamento de confiança, varredura, relatórios e moderação do ClawHub.
x-i18n:
    generated_at: "2026-05-12T23:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# Segurança + Moderação

ClawHub é aberto para publicação, mas as listagens públicas ainda passam por controles de confiança,
varredura, denúncia e moderação. O objetivo é prático: ajudar os usuários
a inspecionar o que instalam, dar aos publicadores um caminho de recuperação para falsos positivos
e manter pacotes abusivos fora da descoberta pública.

Veja também [Uso aceitável](/pt-BR/clawhub/acceptable-usage).

## O que os usuários podem inspecionar

Antes de instalar uma skill ou um plugin, verifique a listagem dela no ClawHub para:

- atribuição de proprietário e fonte
- versão mais recente e changelog
- variáveis de ambiente ou permissões exigidas
- metadados de compatibilidade para plugins
- status de varredura ou moderação
- denúncias, comentários, estrelas, downloads e sinais de instalação quando exibidos

Instale somente conteúdo que você entende e confia.

## Estados de varredura

ClawHub pode mostrar resultados de varredura ou moderação em páginas públicas e diagnósticos
visíveis ao proprietário.

Resultados comuns incluem:

- `clean`: nenhum problema bloqueante foi encontrado.
- `suspicious`: a versão exige cautela ou revisão.
- `malicious`: a versão é considerada insegura.
- `pending`: as verificações ainda não foram concluídas.
- `held`, `quarantined`, `revoked` ou `hidden`: a versão não está totalmente
  disponível em superfícies públicas de instalação.

A redação exata pode variar conforme a superfície, mas o significado prático é o mesmo: se uma
versão estiver retida ou bloqueada, os usuários não devem instalá-la até que o proprietário resolva
o problema ou a moderação a restaure.

## Skills

As varreduras de Skills analisam o pacote de skill publicado, metadados, requisitos
declarados e instruções suspeitas.

ClawHub dá atenção especial a incompatibilidades entre o que uma skill declara e
o que ela parece fazer. Por exemplo, uma skill que faz referência a uma chave de API obrigatória
deve declarar esse requisito em `SKILL.md` para que os usuários possam vê-lo antes
da instalação.

As descobertas de varredura são baseadas em artefatos. Comportamentos esperados de provedores, como credenciais
de API declaradas, callbacks OAuth em localhost, limpeza de desinstalação com escopo, codificação Basic Auth
ou uploads de arquivos selecionados pelo usuário para o provedor informado, são tratados
de modo diferente de encaminhamento oculto de credenciais, acesso amplo a arquivos privados,
destinos de rede não relacionados ou abuso furtivo do navegador.

Veja [Formato de Skill](/pt-BR/clawhub/skill-format).

## Plugins

As versões de plugins incluem metadados do pacote, atribuição de fonte, campos de compatibilidade
e informações de integridade do artefato.

OpenClaw verifica a compatibilidade antes de instalar plugins hospedados no ClawHub. Registros de pacotes
também podem expor metadados de resumo para que o OpenClaw possa verificar artefatos
baixados. ClawScan inclui metadados declarados de env/config do pacote `openclaw.environment`
ao revisar versões de plugins, para que os requisitos declarados de runtime sejam
comparados com o comportamento observado.

## Denúncias

Usuários autenticados podem denunciar Skills, pacotes e comentários.

As denúncias devem ser específicas e acionáveis. O abuso do sistema de denúncias pode, por si só, levar a
ações contra a conta.

Exemplos de denúncia:

- metadados enganosos
- requisitos de credenciais ou permissões não declarados
- instruções de instalação suspeitas
- comentários fraudulentos ou personificação
- registros de má-fé ou uso indevido de marca registrada
- conteúdo que viola [Uso aceitável](/pt-BR/clawhub/acceptable-usage)

## Notas do ClawScan para publicadores

Publicadores podem fornecer uma nota opcional do ClawScan ao publicar uma skill ou
plugin. Essa nota dá ao ClawScan contexto para comportamentos que, de outro modo, poderiam parecer
incomuns, como acesso à rede, acesso ao host nativo ou credenciais específicas
do provedor.

## Retenções de moderação

Quando o scanner estático sinaliza uma skill enviada como maliciosa, o publicador é
automaticamente colocado sob uma retenção de moderação (`requiresModerationAt` definido no
usuário). Isso oculta todas as Skills do publicador, faz com que publicações futuras
comecem ocultas e cria uma entrada de log de auditoria `user.moderation.auto`.

Descobertas estáticas suspeitas são retidas como evidência de arquivo/linha para moderadores,
mas não ocultam conteúdo nem decidem sozinhas o veredito público de varredura.
Novos envios permanecem em estado de revisão/pendente até que a revisão por LLM seja concluída. A varredura
estática bloqueia imediatamente apenas assinaturas maliciosas. Detecções de motores do
VirusTotal permanecem visíveis como evidência de segurança, mas vereditos do VirusTotal Code Insight/Palm
são consultivos e não ocultam Skills por si só. Revisões LLM do ClawScan
mantêm notas alinhadas ao propósito como orientação. Descobertas médias de revisão permanecem visíveis no
artefato, enquanto o filtro suspeito é reservado para preocupações LLM de alto impacto,
descobertas maliciosas ou detecções corroboradas por motores AV.

Administradores podem suspender uma retenção por falso positivo:

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

Isso limpa `requiresModerationAt` e `requiresModerationReason`, restaura
Skills ocultas pela retenção no nível do usuário e grava uma entrada de log de auditoria
`user.moderation.lift`. Skills ocultas por outros motivos, ou cuja própria varredura estática permaneça
maliciosa, continuam ocultas.

## Banimentos e situação da conta

Contas que violam a política do ClawHub podem perder acesso de publicação. Abusos graves
podem resultar em banimentos de conta, revogação de tokens, conteúdo oculto ou remoção
de listagens.

Contas excluídas, banidas ou desativadas não podem usar tokens de API do ClawHub. Se a autenticação da CLI
começar a falhar após uma ação contra a conta, entre na interface web para revisar o estado
da conta. Se o login ou o acesso normal pela CLI estiver bloqueado, entre em contato com
security@openclaw.ai para revisão de recuperação.

## Orientação para publicadores

Para reduzir falsos positivos e melhorar a confiança dos usuários:

- mantenha nomes, resumos, tags e changelogs precisos
- declare variáveis de ambiente e permissões obrigatórias
- adicione uma nota do ClawScan do publicador quando uma versão tiver comportamento incomum, mas intencional
- evite comandos de instalação ofuscados
- inclua link para a fonte quando possível
- use execuções de teste antes de publicar plugins
- responda com clareza se usuários ou moderadores perguntarem sobre o comportamento do pacote
