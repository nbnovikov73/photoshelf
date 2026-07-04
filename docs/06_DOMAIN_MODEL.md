# Domain Model

Photo is the central object. A Photo can be draft or published. Only published photos are visible publicly.

Series is a curated group of photos. A photo may belong to one primary series in MVP.

Tag is lightweight metadata and should not dominate navigation.

SiteSettings stores public identity: title, description, author bio, and contact links.

User is a single admin user in MVP.
