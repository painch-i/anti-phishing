# MVP Product Specification

## Purpose

This document defines the product behavior of the first usable version of Anti-Phishing.

It deliberately avoids implementation details, framework choices, infrastructure choices, database choices, email providers, hosting providers, storage providers, or other architecture decisions.

Those decisions must be documented separately.

## Product goal

Anti-Phishing gives a visitor a simple way to submit suspicious content and receive a human-readable opinion about whether that content appears legitimate, suspicious, or likely to be phishing.

The MVP exists to validate one core promise:

> When a person is unsure whether something they received can be trusted, they can send it to us and receive a clear answer by email.

The service does not promise certainty and must not present its verdict as an absolute guarantee of authenticity or safety.

## Primary user

A visitor who has received or encountered something potentially suspicious and wants a second opinion before taking an action such as:

- clicking a link;
- replying to a message;
- making a payment;
- downloading or opening a file;
- sharing credentials;
- sharing personal or sensitive information.

The visitor does not need to understand cybersecurity terminology.

## Core user journey

The MVP must support the following complete journey:

1. A visitor opens the service.
2. The visitor understands quickly what the service is for.
3. The visitor submits one or more suspicious elements.
4. The visitor provides an email address where the answer can be sent.
5. The visitor submits the request.
6. The visitor receives confirmation that the request was successfully received.
7. The submitted request can be reviewed manually by the operator of the service.
8. The operator records a verdict and, when useful, a short explanation.
9. The visitor receives the verdict by email.

The MVP is considered functionally complete only when this journey can be performed from end to end.

## Submission content

A request may contain one or more elements useful for analysis.

The MVP should support the concept of suspicious assets broadly enough to include, where supported by the implementation:

- screenshots or images;
- documents or files;
- URLs;
- copied text;
- emails or messages represented as text or files.

The exact file formats, maximum sizes and other technical limitations are implementation concerns and must be defined separately.

The product must communicate those limitations clearly when they affect the user.

## Required submission information

A submission must contain:

- at least one element to analyse;
- a valid email address for the response.

The MVP may allow the visitor to add optional context explaining why the content seems suspicious or what they were asked to do.

The visitor must not be required to create an account.

## Submission result

When a request is accepted, the visitor must receive an unambiguous confirmation that the submission was received.

The confirmation must not imply that the content has already been analysed.

If the request cannot be accepted, the visitor must receive an understandable error and should be able to correct the issue when possible.

## Review workflow

The MVP assumes that requests can be reviewed manually.

The operator must be able to access enough information to evaluate a submitted request, including the submitted assets, the visitor's context when present, and the email address associated with the request.

A request must have a clear lifecycle so that the operator can distinguish at minimum between:

- received / awaiting review;
- reviewed / verdict available.

Additional internal states may be introduced later if they solve a demonstrated operational need.

## Verdict

The MVP uses three user-facing verdict categories:

### Legitimate

The submitted content does not show meaningful signs of phishing or fraud based on the available evidence.

This verdict must not be presented as an absolute guarantee.

### Suspicious

There is not enough evidence to confidently classify the content as legitimate or phishing, or there are warning signs that justify caution.

### Likely phishing

The submitted content contains sufficiently strong indicators that it should be treated as a probable phishing or fraudulent attempt.

The wording presented to the visitor may evolve, but the distinction between these three outcomes must remain clear.

## Verdict explanation

A verdict may include a short explanation describing the most important reasons behind the assessment.

The explanation should favour concrete observations over technical jargon.

Examples of useful explanation topics include:

- suspicious sender identity;
- domain mismatch;
- unusual payment request;
- credential request;
- urgency or pressure;
- suspicious URL;
- inconsistent branding;
- unexpected attachment;
- insufficient evidence to make a stronger determination.

The explanation must not reveal internal security-sensitive procedures unnecessarily.

## Email response

Once a verdict is recorded, the visitor must receive an email containing at minimum:

- a clear reference to the submitted request;
- the verdict;
- the explanation when one is provided;
- wording that makes the uncertainty of the assessment understandable when relevant.

The email must not claim that the service provides a formal certification of authenticity.

## Trust and communication principles

The service must remain understandable to non-technical users.

The MVP must avoid creating false confidence.

The product must not use wording such as "100% safe", "guaranteed legitimate", or equivalent certainty unless such certainty can genuinely be established, which is not assumed by this product.

When uncertainty exists, the service should communicate it explicitly.

The primary value of the product is informed caution, not authoritative certification.

## Privacy principles

The MVP must collect only information reasonably necessary to process the request and return the verdict.

Because submitted content may contain personal or sensitive information, the product must treat submissions as private by default.

The product must not intentionally expose one user's submission to another user.

Detailed retention periods, deletion mechanisms and storage architecture are not defined by this product specification and must be documented before production use.

## Security principles

All submitted content must be considered potentially hostile.

The product design must not assume that a submitted file, URL, image, document, email, or text is trustworthy simply because a user provided it.

The MVP must be designed so that analysing suspicious content does not unnecessarily expose visitors or operators to the suspicious content's active behavior.

The concrete technical controls belong in the architecture and security documentation rather than this product specification.

## Anonymous access

The MVP does not require a visitor account.

The email address is used to return the verdict and may also be used when necessary to identify the corresponding request.

User registration, authentication, profiles and request history are outside the MVP unless later proven necessary.

## Operator scope

The MVP may assume a single trusted operator or a very small trusted internal team.

Advanced role management, multi-tenant administration, audit workflows and complex permissions are outside the initial scope.

The operator experience may initially be utilitarian as long as it allows the complete review workflow to function safely and reliably.

## Out of scope for the MVP

The following are explicitly not required for the first usable version:

- automatic AI-generated final verdicts;
- a promise of real-time analysis;
- visitor accounts;
- user dashboards;
- public submission pages or public verdicts;
- browser extensions;
- mobile applications;
- enterprise organisation management;
- API access for third parties;
- automated remediation of phishing incidents;
- automatic interaction with suspicious websites;
- formal legal or financial certification of authenticity;
- complex scoring systems;
- community voting or crowdsourced analysis.

These features may be considered later but must not complicate the MVP without a demonstrated need.

## MVP acceptance criteria

The MVP is successful when all of the following are true:

1. A new visitor can understand the service's purpose without prior explanation.
2. A visitor can submit suspicious content together with an email address.
3. Invalid or incomplete submissions are rejected with understandable feedback.
4. A successful submission produces a clear confirmation.
5. The operator can access the submitted request and its associated content.
6. The operator can assign one of the three supported verdicts.
7. The operator can optionally attach a short explanation.
8. A completed verdict can be sent to the visitor by email.
9. The email clearly communicates the verdict without presenting it as an absolute guarantee.
10. One visitor cannot access another visitor's submission through the normal product flow.
11. The complete journey can be tested end to end without requiring manual database manipulation or source-code modification.

## Product success signal

The first meaningful signal is not traffic, automation or visual polish.

The MVP has demonstrated value when real users can submit genuine doubts, the operator can review them efficiently, and the returned verdict is useful enough that users understand what action they should or should not take next.

## Future evolution

Future specifications may introduce dedicated features for:

- submission experience;
- operator review;
- verdict delivery;
- automated assistance;
- security hardening;
- retention and deletion;
- abuse prevention;
- request tracking;
- enterprise workflows.

Each future feature should refine this specification without silently changing its core promise.