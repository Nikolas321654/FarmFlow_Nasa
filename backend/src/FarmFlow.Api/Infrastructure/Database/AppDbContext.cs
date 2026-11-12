using FarmFlow.Api.Infrastructure.Database.Entities;
using Microsoft.EntityFrameworkCore;

namespace FarmFlow.Api.Infrastructure.Database;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Field> Fields => Set<Field>();
    public DbSet<AlertFeedback> AlertFeedbacks => Set<AlertFeedback>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("postgis");

        modelBuilder.Entity<Field>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Name).HasMaxLength(200).IsRequired();
            entity.Property(f => f.CropType).HasConversion<string>().HasMaxLength(32);
            entity.Property(f => f.Boundary).HasColumnType("geometry (polygon, 4326)").IsRequired();
            entity.Property(f => f.Centroid).HasColumnType("geometry (point, 4326)").IsRequired();
            entity.Property(f => f.DemoScenario).HasMaxLength(64);
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
