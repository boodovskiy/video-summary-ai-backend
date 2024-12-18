import type { Schema, Struct } from '@strapi/strapi';

export interface ComponentsFeature extends Struct.ComponentSchema {
  collectionName: 'components_components_features';
  info: {
    displayName: 'Feature';
  };
  attributes: {
    heading: Schema.Attribute.String;
    icon: Schema.Attribute.Enumeration<
      ['CLOCK_ICON', 'CHECK_ICON', 'CLOUD_ICON']
    >;
    subHeading: Schema.Attribute.Text;
  };
}

export interface ComponentsLink extends Struct.ComponentSchema {
  collectionName: 'components_components_links';
  info: {
    displayName: 'Link';
  };
  attributes: {
    isExternal: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    text: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface LayoutFeaturesSection extends Struct.ComponentSchema {
  collectionName: 'components_layout_features_sections';
  info: {
    displayName: 'Features Section';
  };
  attributes: {
    description: Schema.Attribute.Text;
    feature: Schema.Attribute.Component<'components.feature', true>;
    title: Schema.Attribute.String;
  };
}

export interface LayoutHeroSection extends Struct.ComponentSchema {
  collectionName: 'components_layout_hero_sections';
  info: {
    description: '';
    displayName: 'Hero Section';
  };
  attributes: {
    heading: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.Component<'components.link', false>;
    subHeading: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'components.feature': ComponentsFeature;
      'components.link': ComponentsLink;
      'layout.features-section': LayoutFeaturesSection;
      'layout.hero-section': LayoutHeroSection;
    }
  }
}
