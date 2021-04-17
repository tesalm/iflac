-- ÄLÄ AJA TÄTÄ ELLET TIEDÄ MITÄ TEET --

DROP SCHEMA public CASCADE;

DROP USER backendbotti;
DROP ROLE kirjautunutkayttaja;
DROP USER kirjautumatonkayttaja;
DROP USER mainosmyyja;
DROP ROLE mainosmyyjarooli;
DROP USER taloussihteeri;
DROP ROLE taloussihteerirooli;
DROP USER ylijumala;

CREATE SCHEMA public
    AUTHORIZATION :USER;

COMMENT ON SCHEMA public
    IS 'standard public schema';

GRANT ALL ON SCHEMA public TO :USER;

GRANT ALL ON SCHEMA public TO PUBLIC;