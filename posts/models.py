from django.conf import settings
from django.core.urlresolvers import reverse
from django.db import models
# HOW THE CONTENT IS FORMED/DATABASE


class PostQuerySet(models.QuerySet):
    def published(self):
        return self.filter(published=True)


def upload_location(content, filename):
    return "{}/{}".format(content.id, filename)


class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, )
    title = models.CharField(max_length=200)
    height_field = models.IntegerField(default=0)
    width_field = models.IntegerField(default=0)
    image = models.ImageField(upload_to=upload_location,
                              null=True,
                              blank=True,
                              height_field="height_field",
                              width_field="width_field")
    content = models.TextField()
    slug = models.SlugField(max_length=200, unique=True)
    published = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    objects = PostQuerySet.as_manager()

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        # Find the url of our named url "detail", using the slug
        return reverse("posts:detail", kwargs={"slug": self.slug})

    class Meta:
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"
        ordering = ["-created", "-updated"]
