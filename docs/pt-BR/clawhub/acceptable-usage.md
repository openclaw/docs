---
read_when:
    - Revisar envios em busca de abuso ou violações de política
    - Escrevendo documentação de moderação ou runbooks de revisores
    - Decidindo se uma skill deve ser oculta ou se um usuário deve ser banido
sidebarTitle: Acceptable Usage
summary: 'Política do Marketplace: o que o ClawHub permite e o que ele não hospedará.'
title: Uso aceitável
x-i18n:
    generated_at: "2026-07-05T02:00:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Aceitável

ClawHub hospeda Skills, Plugins, pacotes e metadados de marketplace para o OpenClaw.
Use esta página para decidir se o conteúdo ou o comportamento de publicação pertence ao
ClawHub.

Estas regras se aplicam ao que uma listagem faz, ao que ela pede que os usuários executem, como ela
se representa e como os publicadores usam as superfícies de descoberta, instalação e
confiança do ClawHub. Para estados de moderação e situação da conta, consulte
[Moderação e Segurança da Conta](/clawhub/moderation). Para direitos autorais ou outras reivindicações de direitos,
consulte [Solicitações de Direitos de Conteúdo](/pt-BR/clawhub/content-rights).

## Conteúdo permitido

O ClawHub acolhe conteúdo que seja útil, compreensível e publicado de boa
fé.

| Categoria                                         | Permitido quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produtividade de desenvolvedores                           | A listagem ajuda os usuários a criar, testar, migrar, depurar, documentar ou operar software.                                               |
| Fluxos de trabalho de UI, dados e automação               | O escopo é claro, as credenciais necessárias são explícitas, e ações arriscadas incluem caminhos de revisão, simulação, prévia ou confirmação. |
| Segurança defensiva, moderação e revisão de abuso | A ferramenta é apresentada para revisão autorizada, preserva evidências e mantém claros os limites de aprovação humana.                          |
| Fluxos de trabalho pessoais ou de equipe                       | O fluxo de trabalho usa contas baseadas em consentimento, configuração transparente e permissões explícitas.                                            |
| Catálogos mantidos                              | Cada listagem é distinta, útil, descrita com precisão e razoavelmente mantida.                                                |

O contexto importa. O mesmo tópico pode ser aceitável em um contexto defensivo restrito ou
baseado em consentimento e inaceitável quando empacotado como fluxo de trabalho de abuso.

## Conteúdo não permitido

O ClawHub não hospeda conteúdo cujo objetivo principal seja abuso, engano, execução insegura
ou violação de direitos.

| Categoria                                                    | Não permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso não autorizado ou burla de segurança                      | Burla de autenticação, tomada de conta, abuso de limite de taxa, tomada de chamada ao vivo ou de agente, roubo de sessão reutilizável ou aprovação automática de fluxos de pareamento para usuários não aprovados.                                                                                                                                                   |
| Abuso de plataforma e evasão de banimento                              | Contas furtivas após banimentos, aquecimento ou cultivo de contas, engajamento falso, automação de múltiplas contas, postagens em massa, bots de spam ou automação criada para evitar detecção.                                                                                                                                          |
| Fraude, golpes e fluxos de trabalho financeiros enganosos             | Certificados ou faturas falsas, fluxos de pagamento enganosos, abordagem para golpes, prova social falsa, fluxos de trabalho de identidade sintética para fraude ou ferramentas de gasto/cobrança sem aprovação humana clara.                                                                                                                    |
| Enriquecimento ou vigilância invasivos à privacidade                 | Raspagem de contatos para spam, doxxing, perseguição, extração de leads combinada com abordagem não solicitada, monitoramento encoberto, correspondência biométrica não consensual ou uso de dados vazados ou dumps de violações.                                                                                                                  |
| Representação não consensual ou manipulação de identidade       | Troca de rosto, gêmeos digitais, influenciadores clonados, personas falsas ou outras ferramentas usadas para se passar por alguém ou enganar.                                                                                                                                                                                                 |
| Conteúdo sexual explícito ou geração adulta com segurança desativada | Geração de imagens, vídeos ou conteúdo NSFW; wrappers de conteúdo adulto em torno de APIs de terceiros; ou listagens cujo objetivo principal seja conteúdo sexual explícito.                                                                                                                                                       |
| Requisitos de execução ocultos, inseguros ou enganosos        | Comandos de instalação ofuscados, instaladores pipe-to-shell, como conteúdo baixado executado com `sh` ou `bash` sem revisabilidade clara, requisitos de segredo ou chave privada não declarados, execução remota de `npx @latest` sem revisabilidade clara ou metadados que ocultam o que a listagem realmente precisa para ser executada. |
| Material que infringe direitos autorais ou viola direitos           | Republicar a skill, Plugin, docs, ativos de marca ou código proprietário de outra pessoa sem permissão; violar termos de licença; ou se passar pelo autor ou publicador original.                                                                                                                            |

## Comportamento de marketplace não permitido

O ClawHub também analisa como os publicadores usam o marketplace. Não use o ClawHub para
manipular descoberta, métricas, sinais de confiança, sistemas de moderação ou a
atenção dos usuários.

Comportamento de marketplace não permitido inclui:

- publicar em massa grandes números de listagens de baixo esforço, duplicativas, provisórias ou
  geradas por máquina que não pareçam ter valor real para o usuário
- inundar superfícies de busca ou categorias com Skills ou Plugins quase idênticos
- publicar centenas de listagens com pouco ou nenhum uso, manutenção, clareza de fonte
  ou diferenciação significativa
- inflar artificialmente instalações, downloads, estrelas ou outras métricas de
  engajamento por meio de automação, ciclos de auto-instalação, contas falsas, atividade
  coordenada, engajamento pago ou outro comportamento não orgânico
- criar ou alternar contas para evitar moderação, banimentos, limites de publicador ou
  análise do marketplace
- enganar usuários sobre propriedade, fonte, capacidades, postura de segurança,
  requisitos de instalação ou afiliação com outro projeto ou publicador
- carregar repetidamente conteúdo que já foi ocultado, removido ou bloqueado
  sem corrigir o problema subjacente

Publicação em alto volume não é automaticamente abuso. Grandes catálogos são aceitáveis
quando as listagens são significativamente diferentes, descritas com precisão, mantidas
e usadas por usuários reais. Grandes catálogos se tornam um problema de confiança e segurança quando
o volume é combinado com listagens superficiais, duplicativas, enganosas, não mantidas ou
promovidas artificialmente.

## Direitos de conteúdo

Se você acredita que conteúdo no ClawHub infringe seus direitos autorais ou outros direitos, use
[Solicitações de Direitos de Conteúdo](/pt-BR/clawhub/content-rights). Não use relatos normais do marketplace
para reivindicações de direitos autorais ou direitos, a menos que a listagem também seja insegura,
maliciosa ou enganosa.

## Revisão e aplicação

O ClawHub pode usar verificações automatizadas, sinais estatísticos de abuso, relatos de usuários e
revisão da equipe para identificar conteúdo inseguro ou comportamento abusivo de publicação. Um sinal
não prova abuso por si só; ele ajuda o ClawHub a decidir o que precisa de revisão.

Podemos:

- ocultar, reter, remover, excluir de forma reversível ou, quando compatível com o tipo de recurso,
  excluir definitivamente listagens violadoras
- bloquear downloads ou instalações de versões inseguras
- revogar tokens de API
- excluir de forma reversível conteúdo associado
- restringir acesso de publicação
- banir infratores reincidentes ou graves

Não garantimos aplicação com aviso prévio para abuso óbvio. Consulte
[Moderação e Segurança da Conta](/clawhub/moderation) para relatos, retenções de moderação,
listagens ocultas, banimentos e situação da conta.
