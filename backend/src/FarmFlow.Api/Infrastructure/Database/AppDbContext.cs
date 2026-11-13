using FarmFlow.Api.Infrastructure.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Infrastructure.Database;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Field> Fields => Set<Field>();
    public DbSet<AlertFeedback> AlertFeedbacks => Set<AlertFeedback>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("postgis");

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.GoogleSubjectId).HasMaxLength(255).IsRequired();
            entity.HasIndex(u => u.GoogleSubjectId).IsUnique();
            entity.Property(u => u.Email).HasMaxLength(320).IsRequired();
            entity.Property(u => u.GoogleDisplayName).HasMaxLength(200).IsRequired();
            entity.Property(u => u.CustomDisplayName).HasMaxLength(100);
            entity.Property(u => u.AvatarUrl).HasMaxLength(2048);
        });

        modelBuilder.Entity<Field>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Name).HasMaxLength(200).IsRequired();
            entity.Property(f => f.CropType).HasConversion<string>().HasMaxLength(32);
            entity.Property(f => f.Boundary).HasColumnType("geometry (polygon, 4326)").IsRequired();
            entity.Property(f => f.Centroid).HasColumnType("geometry (point, 4326)").IsRequired();
            entity.Property(f => f.DemoScenario).HasMaxLength(64);
            entity.Property(f => f.IsDemo).HasDefaultValue(false);
            entity.HasIndex(f => f.OwnerId);
            entity.HasIndex(f => f.IsDemo);
            entity.HasOne(f => f.Owner)
                .WithMany()
                .HasForeignKey(f => f.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AlertFeedback>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.AlertType).HasMaxLength(64).IsRequired();
            entity.Property(a => a.Comment).HasMaxLength(1000);
            entity.HasOne(a => a.Field)
                .WithMany()
                .HasForeignKey(a => a.FieldId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
